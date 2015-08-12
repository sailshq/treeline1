module.exports = {


  friendlyName: 'Connect to Treeline',


  description: 'Connect a client WebSocket to the Treeline mothership.',


  inputs: {

    onSocketDisconnect: {
      description: 'A function that will be called when the socket disconnects.',
      example: '->'
    },

    onSocketConnect: {
      description: 'A function that will be called when the socket connects or reconnects.',
      example: '->'
    },

    toProcessChangelog: {
      description: 'A lamda function',
      example: '->',
      contract: {
        inputs: {
          projectChangelog: {
            description: 'The project changelog; an array of project/dependency changes.',
            extendedDescription: 'Currently this always just covers the top-level project (i.e. `length===1`).',
            example: [{}]
          },
          previousHash: {
            description: 'The previous hash value for this project',
            example: '*'
          },
          smash: {
            description: 'Flag indicating whether these changes should replace existing files completely',
            example: true
          }
        },
        exits: {
          success: {},
          error: {}
        }
      },
      required: true
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'https://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    },

    timeout: {
      description: 'The max time to wait before giving up on initial connection (in miliseconds)',
      example: 5000,
      defaultsTo: 5000
    }

  },


  exits: {

    tookTooLong: {
      description: 'The socket took too long to connect.  Are you sure your internet connection is working?  Or maybe the server is not online, or not accepting WebSocket traffic.',
      extendedDescription: 'It is also possible the server is just slow, in which case you should increase the `timeout` option.'
    },

    success: {
      description: 'Returns a Sails.js/Socket.io client socket.',
      variableName: 'socket',
      example: '==='
    },

  },


  fn: function (inputs,exits) {
    var async = require('async');
    var Sockets = require('machinepack-sockets');
    var debug = require('debug')('connect-to-treeline');
    var paused = false;

    // Set up a cute little queue to guarantee in-order processing of
    // incoming notifications and their changelogs. This is used below
    // by the code in this `fn` proxying our `inputs.toProcessChangelog`
    // notifier, as well as in a series of setTimeouts that may result.
    var projectChangeQueue = [];

    // A spinlock that tracks whether our process is currently processing a changelog.
    var currentlyProcessingChangelogs = false;

    // Build our set of listeners
    var listeners = [];
    if (inputs.onSocketDisconnect) {
      // If the connection to treeline.io is broken, we'll trigger
      // the `onSocketDisconnect` listener.
      listeners.push({
        name: 'disconnect',
        fn: inputs.onSocketDisconnect
      });
    }

    if (inputs.onSocketConnect) {
      // We trigger the `onSocketConnect` listener whenever a connection
      // occurs.  Unfortunately we can't use the `reconnect` event because
      // it seems to fire before the socket is fully connected, and won't
      // allow it send messages to the server.  The upshot is you need to
      // distinguish the initial connection from subsequent reconnects yourself,
      // probably using a "initialConnectionHappened" flag or the like.
      listeners.push({
        name: 'connect',
        fn: inputs.onSocketConnect
      });
    }


    // If treeline.io says something changed...
    listeners.push({
      name: 'machinepack',
      fn: function (notification){

        // Parse the changelog from the incoming socket notification.
        var projectChangelog;
        try {
          projectChangelog = notification.data.changelog;
          projectChangelog.previousHash = notification.data.previousHash;
          // If the "smash" flag was sent, we can clear the changelog queue
          // and replace it with this new changelog.  Otherwise we may be able
          // to merge successive changelogs algorithmically (see note below)
          if (notification.data.smash === true) {
            // Set the "smash" flag on the changeset itself (the array)
            projectChangelog.smash = true;
            debug('Saw `smash: true`; clearing queue and replacing with new changeset.');
            projectChangeQueue = [];
          }
        }
        catch (e) {
          // If the notification cannot be parsed as expected,
          // this is likely a bogus version of the Treeline API or a serious bug.
          console.error(e);
          projectChangelog = [];
        }

        // Push this new changelog to the end of our queue.
        projectChangeQueue.push(projectChangelog);

        // --------------------------------------------------------------------------------
        // Note that we could eventually support batching in the above approach,
        // if this ever became a serious bottleneck. Basically instead of just dumbly pushing
        // on the changelog, we could inspect existing changelogs in the queue and merge
        // them using one or more strategies defined in a ruleset.
        //
        // That said, it's not a good idea to explore this now (too much risk of never-ending
        // nerdy explorations), but it's worth noting for the future-- particularly since it's
        // not immediately obvious how to approach the optimization problem when you first look
        // at it.
        // --------------------------------------------------------------------------------

        // If our process is `currentlyProcessingChangelogs`, then we can rest assured that the new changes
        // we just pushed will be processed in due course when the existing changes finish
        // being applied. So we'll just bail out.
        if (currentlyProcessingChangelogs || paused) {
          return;
        }

        // Otherwise, this must be the only item in the queue--which means we can go ahead and
        // start processing the changelog ourselves.
        //
        // But before we do anything asynchronous and let go of the peace pipe,
        // we'll grab the `currentlyProcessingChangelogs` lock.
        currentlyProcessingChangelogs = true;


        // Now we're ready:
        async.whilst(function() {
          return currentlyProcessingChangelogs;
        },
        function(cb) {
          // First we shift off the item we just pushed on our single-item queue:
          // (notice that we overwrite the `projectChangelog` variable even though they're exactly the same-
          //  see the note above about future batching to understand why)
          projectChangelog = projectChangeQueue.shift();

          // Note that we can't simply rely on a notifier function because they're volatile;
          // i.e. we don't get any kind of acknowledgement signal when its done running.
          // That's what exits are for.
          //
          // So instead, we'll use the implementation provided as `inputs.toProcessChangelog`.
          // It's a lamda input with a contract, which means we can call it as a machine.
          inputs.toProcessChangelog({
            projectChangelog: projectChangelog,
            // "smash" and "previousHash" are properties set on an array, so they won't
            // survive type validation.  So, we'll make them their own inputs.
            smash: projectChangelog.smash,
            previousHash: projectChangelog.previousHash
          }).exec({
            // If there was an error processing the changelog, it's always fatal: meaning
            // we need to clear out the rest of the changelogs in the queue as well and get a
            // fresh changelog.  That's because otherwise, we could end up in a situation where
            // we got out of sync (each changelog is idempotent at the moment, but we shouldn't
            // rely on that going forward)
            error: function (err) {
              return cb(err);
            },

            // If the processing of the changelog completes successfully...
            success: function () {
              // We're almost done- it's just that we have to go back and check our queue again,
              // just in case other changelogs have been pushed on in the mean time since we
              // last checked (back when we first received the change event from the server)

              // If there are no more changelogs queued up, release the lock
              // (which will cause us to bail).
              if (projectChangeQueue.length === 0) {
                currentlyProcessingChangelogs = false;
              }

              // Otherwise, we'll leave `currentlyProcessingChangelogs` as true, which lets us
              // move on to the next changelog.
              return cb();

            }
          }); //</inputs.toProcessChangelog>
        }, function afterwards(err) {
          if (err) {
            // We don't need to do any kind of notification for an error here because this is
            // the result from a lamda implementation-- meaning any notifications can be handled
            // in userland (i.e. in the `inputs.toProcessChangelog` function body)

            // Clear out our queue (but don't release the lock! Things are crazy enough at this point)
            projectChangeQueue = [];

            // At some point, we can have this fetch a fresh signature for the project, call out
            // to the server with the hashes, and then start processing that changelog instead.
            // TODO

            // For now, we just shut down the process.
            // TODO
            console.error(err);
            return;
          }

          // If we're here, we're done and everything worked!
          return;
        });
      }
    }); //</listeners.push>

    Sockets.connectClientSocket({
      baseUrl: inputs.treelineApiUrl,
      timeout: inputs.timeout,
      eventListeners: listeners
    }).exec({
      error: function (err) {
        return exits.error(err);
      },
      tookTooLong: exits.tookTooLong,
      success: function (socket){
        socket.pauseTreelineQueue = function() {paused = true;}
        socket.resumeTreelineQueue = function() {paused = false;}
        return exits.success(socket);
      }
    });

  }


};
