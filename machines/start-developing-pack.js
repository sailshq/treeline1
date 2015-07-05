module.exports = {


  friendlyName: 'Start interactive development session (machinepack)',


  description: 'Preview the machinepack in the current directory, streaming down updated code as changes are made on https://treeline.io.',


  extendedDescription: 'Note that this will run the `scribe` tool as a local server (http://localhost:1337).',


  inputs: {

    dontOpenBrowser: {
      description: 'Prevent the browser from being opened automatically and navigating to the scribe utility when a pack is previewed?',
      example: true,
      defaultsTo: false
    },

    onHasKeychain: {
      description: 'An optional notifier function that will be called when a keychain is located (doesn\'t mean it is necessarily valid).',
      example: '->',
      defaultsTo: function (){}
    },

    onConnected: {
      description: 'An optional notifier function that will be called when a connection is established with Treeline.io and this pack is being initially synchronized with the server.',
      example: '->',
      defaultsTo: function (){}
    },

    onSyncError: {
      description: 'An optional notifier function that will be called when Treeline attempts to sync remote changes to the local pack, but it fails.',
      example: '->',
      defaultsTo: function (){}
    },

    onSyncSuccess: {
      description: 'An optional notifier function that will be called each time Treeline successfully applies synced remote changes to the local project.',
      example: '->',
      defaultsTo: function (){}
    },

    onInitialSyncSuccess: {
      description: 'An optional notifier function that will be called the first time Treeline successfully synchronizes the local project w/ treeline.io.',
      example: '->',
      defaultsTo: function (){}
    },

    onPreviewServerLifted: {
      description: 'An optional notifier function that will be called when the preview server has successfully lifted and can be safely accessed.',
      example: '->',
      defaultsTo: function (){}
    },

    onSocketDisconnect: {
      description: 'An optional notifier function that will be called if/when the remote connection with http://treeline.io is lost (and as the local Treeline client attempts to reconnect).',
      example: '->',
      defaultsTo: function (){}
    },

    onFlushError: {
      description: 'An optional notifier function that will be called if/when the router of the locally-running app cannot be flushed.',
      example: '->',
      defaultsTo: function (){}
    },

    localPort: {
      description: 'The local port to run the `scribe` utility on.  Defaults to 1337.',
      example: 1337,
      defaultsTo: 1337
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    }

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
    },

    noMachinepacks: {
      description: 'No machinepacks belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    forbidden: {
      description: 'Unrecognized username/password combination.',
      extendedDescription: 'Please try again or visit http://treeline.io to reset your password or locate your username.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      description: 'The success exit should never be triggered.'
    },

  },


  fn: function (inputs, exits){

    var async = require('async');
    var _ = require('lodash');
    var Scribe = require('test-scribe');
    var Http = require('machinepack-http');
    var MPProc = require('machinepack-process');
    var LocalMachinepacks = require('machinepack-localmachinepacks');
    var thisPack = require('../');
    var getSocketAndConnect = require('../standalone/sails-client');


    // The path to pack is always the current working directory
    // (for the time being, at least)
    var pathToPack = process.cwd();

    // Now simultaneously:
    //  • lift the preview server
    //  • synchronize local pack files w/ http://treeline.io
    async.parallel([
      function(next){
        // Lift the `scribe` utility as a sails server running on
        // a configurable local port.
        Scribe({
          pathToPack: pathToPack,
          port: inputs.localPort
        }, function (err, localScribeApp) {
          if (err) {
            // Failed to start scribe.
            return next(err);
          }
          // Trigger optional notifier function.
          inputs.onPreviewServerLifted('http://localhost:'+inputs.localPort);
          return next();
        });
      },
      function(next){

        thisPack.loginIfNecessary({
          treelineApiUrl: inputs.treelineApiUrl
        }).exec({
          error: function (err) {
            return next(err);
          },
          success: function (me) {
            thisPack.linkIfNecessary({
              type: 'machinepack',
              treelineApiUrl: inputs.treelineApiUrl
            }).exec({
              error: function (err) {
                return next(err);
              },
              success: function (linkedProject) {
                if (linkedProject.type !== 'machinepack') {
                  return next.error('The project in this directory is not a machinepack.  Maybe try `treeline preview app` instead?');
                }

                // Trigger optional notifier function.
                inputs.onHasKeychain(me.username);

                // Read local pack and compute hash of the meaningful information.
                LocalMachinepacks.getSignature({
                  dir: pathToPack
                }).exec(function (err, packSignature) {
                  if (err) {
                    // Ignore "notMachinepack" errors (make up an empty signature)
                    if (err.exit === 'notMachinepack') {
                      packSignature = {};
                    }
                    // All other errors are fatal.
                    else {
                      return next(err);
                    }
                  }

                  // Now we'll start up a synchronized development session by
                  // listening for changes from Treeline by first connecting a socket,
                  // then sending a GET request to subscribe to this particular pack.
                  // With that request, send hash of local pack to treeline.io, requesting
                  // an update if anything has changed (note that this will also subscribe
                  // our socket to future changes)
                  getSocketAndConnect({
                    baseUrl: inputs.treelineApiUrl
                  }, function (err, socket) {
                    if (err) {
                      return next(err);
                    }

                    // Trigger optional notifier function.
                    inputs.onConnected();

                    socket.request({
                      method: 'get',
                      url: '/api/v1/machinepacks/'+linkedProject.id+'/sync',
                      headers: { 'x-auth': me.secret },
                      params: {
                        // Send along hashes of each machine, as well as one
                        // additional hash for the pack's package.json metadata.
                        packHash: packSignature.packHash,
                        machineHashes: packSignature.machineHashes
                      }
                    }, function serverResponded (body, jwr) {
                      // console.log('Sails responded with: ', body); console.log('with headers: ', jwr.headers); console.log('and with status code: ', jwr.statusCode);
                      // console.log('jwr.error???',jwr.error);
                      if (jwr.error) {

                        // Set up an exit via 'forbidden'.
                        if (jwr.statusCode === 401) {
                          jwr.exit = 'forbidden';
                        }

                        // If initial pack subscription fails, kill the scribe server
                        // and stop listening to changes
                        return next(jwr);
                      }

                      // Now subscribed.

                      // treeline.io will respond with a changelog, which may or may not be
                      // empty.  So we immediately apply it to our local pack on disk.
                      thisPack.syncRemoteChanges({
                        type: 'machinepack',
                        changelog: body,
                        onSyncSuccess: inputs.onSyncSuccess,
                        localPort: inputs.localPort
                      }).exec({
                        // If the initial sync or flush in scribe fails, then
                        // give up with an error msg.
                        error: function (err) {
                          return next(err);
                        },
                        success: function (){
                          // Initial sync complete
                          inputs.onInitialSyncSuccess();

                          // Open browser (unless disabled)
                          if (inputs.dontOpenBrowser) {
                            return next();
                          }
                          MPProc.openBrowser({
                            url: 'http://localhost:'+inputs.localPort
                          }).exec({
                            error: function (err){ return next(); },
                            success: function() { return next(); }
                          });
                        },
                      });

                    });

                    // If treeline.io says something changed, apply the changelog
                    // it provides to our local pack on disk.
                    socket.on('machinepack', function (notification){

                      var changelog;
                      try {
                        changelog = notification.data.changelog;
                      }
                      catch (e) {
                        inputs.onSyncError(e);
                      }

                      thisPack.syncRemoteChanges({
                        type: 'machinepack',
                        changelog: changelog,
                        onSyncSuccess: inputs.onSyncSuccess,
                        localPort: inputs.localPort
                      }).exec({
                        // If applying a pack changelog to the local machinepack
                        // fails, then trigger the `onSyncError` notifier function.
                        error: function (err){
                          inputs.onSyncError(err);
                        },
                        // If reloading the pack in scribe fails, then trigger the
                        // `onFlushError` notifier function.
                        couldNotFlush: function (err){
                          inputs.onFlushError(err);
                        },
                        success: function (){
                          // everything is hunky dory
                        },
                      });
                    });

                    // Trigger `onSocketDisconnect` if the connection to treeline.io is broken
                    socket.on('disconnect', function() {
                      inputs.onSocketDisconnect();
                    });

                    // If anything goes horribly wrong or the process is stopped manually w/ <CTRL+C>,
                    // then ensure we:
                    //  • stop listening for changes
                    //  • kill the local server running `scribe`
                    //
                    // TODO
                    // (this is happening already in almost every case thanks to the `process.exit(1)`
                    //  we're calling in `bin/treeline-preview`. But we should make doubly sure.)

                  }); // </getSocketAndConnect>
                }); // </LocalMachinepacks.getSignature>
              }
            });
          }
        });
      },
    ], function afterwards(err) {
      if (err) {
        return exits(err);
      }

    });

  }

};

