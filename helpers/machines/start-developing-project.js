module.exports = {


  friendlyName: 'Start interactive development session',


  description: 'Start a dev preview session with an app or machinepack.',


  extendedDescription: 'Preview the Treeline project (app or pack) in the current directory, streaming down updated code as changes are made on https://treeline.io.  Note that this will run a preview server on a local port (by default, accessible at `http://localhost:1337`).',


  inputs: {

    onHasKeychain: {
      description: 'An optional notifier function that will be called when a keychain is located (doesn\'t mean it is necessarily valid).',
      example: '->',
      defaultsTo: function (){}
    },

    onLoadProjectInfo: {
      description: 'An optional notifier function that will be called when basic info about the pack or app has been retrieved.',
      example: '->',
    },

    onConnected: {
      description: 'An optional notifier function that will be called when a connection is established with Treeline.io and this project is being initially synchronized with the server.',
      example: '->',
      defaultsTo: function (){}
    },

    onSyncError: {
      description: 'An optional notifier function that will be called when Treeline attempts to sync remote changes to the local project, but it fails.',
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

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project this is ("app" or "machinepack")',
      extendedDescription: 'If left unspecified, we\'ll sniff around in the directory and guess what kind of thing this is based on its package.json file.',
      example: 'machinepack'
    },

    offline: {
      friendlyName: 'Preview offline?',
      description: 'If enabled, will not attempt to sync with Treeline.io and instead lift the preview server using existing local code.',
      extendedDescription: 'Be careful when using this option (there may be code changes on treeline.io which were not synced!)',
      example: false,
      defaultsTo: false
    },

    dontOpenBrowser: {
      description: 'Prevent the browser from being opened automatically and navigating to the scribe utility when a pack is previewed?',
      example: true,
      defaultsTo: false
    },

    localPort: {
      description: 'The local port to run the preview server on.  Defaults to 1337.',
      example: 1337,
      defaultsTo: 1337
    },

    dir: {
      description: 'Path to the local project.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    keychainPath: {
      description: 'Path to the keychain file on this computer. Defaults to `.treeline.secret.json` in the home directory.',
      extendedDescription: 'If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
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
    var Http = require('machinepack-http');
    var MPProc = require('machinepack-process');
    var IfThen = require('machinepack-ifthen');
    var LocalMachinepacks = require('machinepack-localmachinepacks');
    var thisPack = require('../');


    // The path to the project is generally the current working directory
    // Here, we ensure is is absolute, and if it was not specified, default
    // it to process.cwd(). If it is relative, we resolve it from the current
    // working directory.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    // If `inputs.type` was provided, use it.
    // Otherwise, sniff around for the package.json file and figure out
    // what kind of project this is.
    thisPack.normalizeType({
      type: inputs.type
    }).exec({
      error: exits.error,
      success: function (type) {

        // Override `inputs.type` with the normalized version.
        inputs.type = type;

        // Keep track of whether or not we were able to lift the preview app yet,
        // as well as the error, if there is one.
        var hasLiftedPreviewServer;

        // Now simultaneously:
        //  • lift the preview server
        //  • synchronize local project files w/ http://treeline.io
        async.parallel([


          function _liftThePreviewServer(next){
            // Lift the preview server on a configurable local port
            // (either the Sails app being developed, or the `scribe` utility
            //  running as a Sails server)
            liftPreviewServer({
              type: inputs.type,
              pathToProject: inputs.dir,
              port: inputs.localPort
            }, {
              error: function (err) {
                // If we fail to start the preview server, don't give up yet
                // (just try again after everything has synced)

                // So we ignore `err`.
                return next();
              },
              success: function () {
                // Trigger optional notifier function.
                inputs.onPreviewServerLifted('http://localhost:'+inputs.localPort);

                hasLiftedPreviewServer = true;
                return next();
              }
            });
          },


          function _syncWithTreelineIo(next){

            thisPack.loginIfNecessary({
              keychainPath: inputs.keychainPath,
              treelineApiUrl: inputs.treelineApiUrl
            }).exec({
              error: function (err) {
                return next(err);
              },
              success: function (me) {
                thisPack.linkIfNecessary({
                  type: inputs.type,
                  dir: inputs.dir,
                  keychainPath: inputs.keychainPath,
                  treelineApiUrl: inputs.treelineApiUrl
                }).exec({
                  error: function (err) {
                    return next(err);
                  },
                  success: function (linkedProject) {

                    // Trigger optional notifier function.
                    inputs.onHasKeychain(me.username);

                    // Read local pack or app (and compute hashes of meaningful information)
                    IfThen.ifThenFinally({

                      bool: (inputs.type === 'app'),

                      expectedOutput: {},

                      // If this is an app, get the app signature.
                      then: function (__, exits) {
                        // TODO
                        return exits.error(new Error('Not currently supported.'));
                      },

                      // Otherwise, we're talking about a machinepack,
                      // so get the pack signature instead.
                      orElse: function (__, exits) {
                        LocalMachinepacks.getSignature({
                          dir: inputs.dir
                        }).exec(function (err, packSignature) {
                          if (err) {
                            // Ignore "notMachinepack" errors (make up an empty signature)
                            if (err.exit === 'notMachinepack') {
                              packSignature = {};
                            }
                            // All other errors are fatal.
                            else {
                              return exits.error(err);
                            }
                          }
                          return exits.success(packSignature);
                        }); // </LocalMachinepacks.getSignature>
                      },

                    }).exec({
                      error: function (err) {
                        return exits.error(err);
                      },
                      success: function (projectSignature){

                        // Trigger optional notifier function.
                        inputs.onLoadProjectInfo(_.extend({
                          type: inputs.type
                        }, projectSignature.pack));


                        // If offline mode is enabled, then skip syncing.
                        IfThen.ifThenFinally({

                          bool: inputs.offline,

                          // If this is offline mode, don't bother syncing changes--
                          // instead we just need to ensure the preview server is lifted.
                          // But since we already do that below, we're good to continue onwards.
                          then: function (__, exits) {
                            return exits.success();
                          }, // </then (offline mode)>

                          // Otherwise we'll start up a synchronized development session by
                          // listening for changes from Treeline by first connecting a socket,
                          // then sending a GET request to subscribe to this particular pack.
                          // With that request, send hash of local pack to treeline.io, requesting
                          // an update if anything has changed (note that this will also subscribe
                          // our socket to future changes)
                          orElse: function (__, exits) {

                            thisPack.connectToTreeline({
                              treelineApiUrl: inputs.treelineApiUrl,
                              listeners: [
                                {
                                  name: 'disconnect',
                                  // If the connection to treeline.io is broken, trigger
                                  // the `onSocketDisconnect` notifier.
                                  fn: function () {
                                    inputs.onSocketDisconnect();
                                  }
                                },
                                {
                                  name: 'machinepack',
                                  // If treeline.io says something changed, apply the changelog
                                  // it provides to our local pack on disk.
                                  fn: function (notification) {
                                    var changelog;
                                    try {
                                      changelog = notification.data.changelog;
                                    }
                                    catch (e) {
                                      inputs.onSyncError(e);
                                    }

                                    thisPack.syncRemoteChanges({
                                      type: inputs.type,
                                      changelog: changelog,
                                      onSyncSuccess: inputs.onSyncSuccess,
                                      localPort: inputs.localPort,
                                      treelineApiUrl: inputs.treelineApiUrl
                                    }).exec({
                                      // If applying a pack changelog to the local machinepack
                                      // fails, then trigger the `onSyncError` notifier function.
                                      error: function (err){
                                        inputs.onSyncError(err);
                                      },
                                      // If flushing (reloading the pack in `scribe`, or flushing routes
                                      // in a Sails app)  fails, then trigger the `onFlushError` notifier function.
                                      couldNotFlush: function (err){
                                        inputs.onFlushError(err);
                                      },
                                      success: function doNothing(){},
                                    });
                                  }
                                }
                              ]
                            }, function (err, socket) {
                              if (err) {
                                return exits.error(err);
                              }

                              // Trigger optional notifier function.
                              inputs.onConnected();

                              thisPack.fetchAndSubscribeToProject({
                                socket: socket,
                                type: inputs.type,
                                id: linkedProject.id,
                                secret: me.secret,
                                machineHashes: packSignature.machineHashes,
                                packHash: packSignature.packHash
                              }).exec({
                                error: exits.error,
                                success: function (packChangelog){
                                  // Now subscribed.

                                  // treeline.io will respond with a changelog, which may or may not be
                                  // empty.  So we immediately apply it to our local pack on disk.
                                  thisPack.syncRemoteChanges({
                                    type: inputs.type,
                                    changelog: body,
                                    onSyncSuccess: inputs.onSyncSuccess,
                                    localPort: inputs.localPort,
                                    treelineApiUrl: inputs.treelineApiUrl
                                  }).exec({
                                    // If the initial sync fails, then give up with an error msg.
                                    error: function (err) {
                                      return exits.error(err);
                                    },
                                    // If preview server could not be initially flushed, that's ok-
                                    // it might just not be lifted yet, or might have failed the first time.
                                    // We'll try it again below.
                                    couldNotFlush: function (flushErr){
                                      // If the preview server WAS already lifted and it could
                                      // not be flushed, trigger the notification function.
                                      if (hasLiftedPreviewServer) {
                                        inputs.onFlushError(flushErr);
                                      }

                                      // Then move on either way.
                                      // (but notice we don't call the notifier callback
                                      //  yet, since the sync isn't really done until the
                                      //  preview app has been flushed)
                                      return exits.success();
                                    },
                                    success: function (){

                                      // Since the initial sync is complete, we'll
                                      // call the notifier callback.
                                      inputs.onInitialSyncSuccess();

                                      return exits.success();
                                    },
                                  }); //</thisPack.syncRemoteChanges>
                                }
                              }); //</thisPack.fetchAndSubscribeToProject>
                            }); // </thisPack.connectToTreeline>
                          } //</orElse -> (not offline mode)>

                        }).exec({

                          error: function (err) {
                            return next(err);
                          },

                          success: function (){
                            return next();
                          }
                        }); //</IfThen.ifThenFinally -> `inputs.offline`>
                      }
                    }); //<IfThen.ifThenFinally -> `inputs.type==='app'`>
                  }
                }); // </linkIfNecessary>
              }
            }); // </loginIfNecessary>
          },
        ], function afterwards(err) {
          if (err) {
            return exits(err);
          }

          // Now we'll check to see if the preview server has lifted.
          // If it has, we're good- continue on.
          IfThen.ifThenFinally({
            // But if it's not lifted yet, there MUST be lift errors,
            // b/c at this point in the code, it HAS to have either successfully
            // lifted or failed.
            bool: !hasLiftedPreviewServer,
            then: function (__,exits){
              liftPreviewServer({
                type: inputs.type,
                pathToProject: inputs.dir,
                port: inputs.localPort
              }, {
                // If it still cannot be lifted, give up.
                error: function (err) {
                  return exits.error(err);
                },
                // If it lifts this time, then we'll trigger two
                // notifier callbacks: one for the lifting of the preview
                // server, and one for the completion of the initial sync.
                // Then we'll continue.
                success: function (){

                  // Trigger optional notifier function.
                  inputs.onPreviewServerLifted('http://localhost:'+inputs.localPort);

                  // Track that we've been able to lift the preview server.
                  hasLiftedPreviewServer = true;

                  // Only fire the "onInitialSyncSuccess" notifier callback if
                  // this is NOT offline mode.
                  if (!inputs.offline) {
                    inputs.onInitialSyncSuccess();
                  }

                  return exits.success();
                }
              });
            }
          }).exec({
            error: exits.error,
            success: function (){

              // Open browser (unless disabled)
              IfThen.ifThenFinally({
                bool: !inputs.dontOpenBrowser,
                then: function (__, exits){
                  MPProc.openBrowser({
                    url: 'http://localhost:'+inputs.localPort
                  }).exec(exits);
                }
              }).exec(function (err) {
                // Ignore any `err` encountered opening the browser.

                // All done!
                return exits.success();
              }); // </IfThen.ifThenFinally -> `!dontOpenBrowser`>
            }
          }); // </IfThen.ifThenFinally -> `!hasLiftedPreviewServer`>
        }); //</async.parallel>
      }
    }); //</normalizeType>
  }

};



// If anything goes horribly wrong or the process is stopped manually w/ <CTRL+C>,
// then ensure we:
//  • stop listening for changes
//  • kill the local preview server
//
// (this is happening already in almost every case thanks to the `process.exit(1)`
//  we're calling in `bin/treeline-preview`. But we should make doubly sure.)










/**
 * this is only temporary
 * @return {[type]} [description]
 */
function liftPreviewServer (inputs, exits){
  var _ = require('lodash');

  // This might be an app...
  if (inputs.type === 'app') {

    var Sails = require('sails').Sails;

    var sailsConfig = _.merge({
      log: { level: 'error' }
    }, inputs);
    sailsConfig = _.merge(sailsConfig,{
      globals: false,
      hooks: {
        grunt: false
      }
    });

    var app = Sails();
    app.lift(sailsConfig, function (err) {
      if (err) {
        return exits.error(err);
      }
      return exits.success(app);
    });
    return;
  }


  // ...or a pack.
  var Scribe = require('test-scribe');

  Scribe(_.extend({
    pathToPack: inputs.pathToProject
  }, inputs), function (err, localScribeApp) {
    if (err) {
      return exits.error(err);
    }
    return exits.success(localScribeApp);
  });

}
