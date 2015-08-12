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

    onConnecting: {
      description: 'An optional notifier function that will be called the first time Treeline attempts to connect.',
      example: '->',
      defaultsTo: function (){}
    },

    onReconnectSuccess: {
      description: 'An optional notifier function that will be called when Treeline successfully reconnects after an interruption.',
      example: '->',
      defaultsTo: function (){}
    },

    onReconnectError: {
      description: 'An optional notifier function that will be called when Treeline is unable to reconnect after an interruption.',
      example: '->',
      defaultsTo: function (){}
    },

    onSyncing: {
      description: 'An optional notifier function that will be called any time Treeline attempts to synchronize code.',
      example: '->',
      defaultsTo: function (){}
    },

    onInitialConnectSuccess: {
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

    onNpmInstall: {
      description: 'An optional notifier function that will be called when we start NPM installing things.',
      example: '->'
    },

    onNpmInstallError: {
      description: 'An optional notifier function that will be called when we start NPM installing things.',
      example: '->'
    },

    onNpmInstallSuccess: {
      description: 'An optional notifier function that will be called when we start NPM installing things.',
      example: '->'
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

    cantDetermineType: {
      description: 'Could not determine the type of Treeline app in the current directory (is directory empty?)'
    },

    badCliVersion: {
      description: 'This CLI verison does not match the current Treeline API\'s minimum requirements.'
    },

    unrecognizedCredentials: {
      description: 'Unrecognized username/password combination.'
    },

    forbidden: {
      description: 'The Treeline server indicated that the provided keychain is not permitted to access this remote.'
    },

    notFound: {
      description: 'The Treeline server indicated that the project linked in this directory no longer exists.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?',
      outputDescription: 'The URL we attempted to connect to.',
      example: 'https://api.treeline.io'
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
    var LocalApps = require('machinepack-local-sails-apps');
    var LocalTreelineProjects = require('machinepack-local-treeline-projects');
    var thisPack = require('../');

    IfThen.ifThenFinally({
      bool: inputs.offline,
      then: function(__, exits) {exits.success();},
      orElse: function(__, exits) {

        thisPack.verifyCliCompatibility({treelineApiUrl: inputs.treelineApiUrl}).exec({
          error: exits.error,
          incompatible: function(){exits.error('badCliVersion');},
          success: exits.success
        });

      }
    }).exec({
      error: function(err) {
        if (err == 'badCliVersion') {return exits.badCliVersion();}
        return exits.error(err);
      },
      success: function() {

        // Check that this version of CLI is compatible with the server we're trying to connect with
        thisPack.verifyCliCompatibility({treelineApiUrl: inputs.treelineApiUrl}).exec({
          error: exits.error,
          incompatible: exits.badCliVersion,
          success: function(results) {

            // The path to the project is generally the current working directory
            // Here, we ensure is is absolute, and if it was not specified, default
            // it to process.cwd(). If it is relative, we resolve it from the current
            // working directory.
            inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

            // If `inputs.type` was provided, use it.
            // Otherwise, sniff around for the package.json file and figure out
            // what kind of project this is.
            LocalTreelineProjects.normalizeType({
              type: inputs.type
            }).exec({
              error: exits.cantDetermineType,
              success: function (type) {

                // Override `inputs.type` with the normalized version.
                inputs.type = type;

                // Keep track of whether or not we were able to lift the preview app yet,
                // as well as the error, if there is one.
                var hasLiftedPreviewServer;

                // Keep track of whether an interactive prompt might be open.
                var interactivePromptMightBeOpen;

                async.auto({

                  // For app projects, overwrite copies of serverError.js that have a bad Lodash reference.
                  // TODO--remove this in the next major version of CLI
                  fixBadServerErrorResponse: function(next) {

                    if (inputs.type == 'app') {
                      thisPack.fixResponseFiles({dir: inputs.dir}).exec(next);
                    } else {
                      return next();
                    }

                  },

                  // Now simultaneously:
                  //  • lift the preview server
                  //  • synchronize local project files w/ http://treeline.io
                  _liftThePreviewServer: [function(next){
                  // _liftThePreviewServer: [function(next){
                    // Lift the preview server on a configurable local port
                    // (either the Sails app being developed, or the `scribe` utility
                    //  running as a Sails server)
                    thisPack.liftPreviewServer({
                      type: inputs.type,
                      dir: inputs.dir,
                      localPort: inputs.localPort,
                      onAppError: function(err) {
                        if (hasLiftedPreviewServer) {
                          return exits.error(err);
                        }
                        return next();
                      }
                    }).exec({
                      error: function (err) {
                        console.log(err);
                        // If we fail to start the preview server, don't give up yet
                        // (just try again after everything has synced)

                        // So we ignore `err`.
                        return next();
                      },
                      success: function () {
                        // Don't trigger the notifier callback if interactive
                        // prompt might be going:
                        if (!interactivePromptMightBeOpen) {
                          // Trigger optional notifier function.
                          inputs.onPreviewServerLifted('http://localhost:'+inputs.localPort);
                        }


                        hasLiftedPreviewServer = true;
                        return next();
                      }
                    });
                  }],


                  _syncWithTreelineIo: [function(next){
                  // _syncWithTreelineIo: [function(next){

                    interactivePromptMightBeOpen = true; // <= spin-lock

                    thisPack.loginIfNecessary({
                      keychainPath: inputs.keychainPath,
                      treelineApiUrl: inputs.treelineApiUrl
                    }).exec({
                      error: function (err) {
                        interactivePromptMightBeOpen = false; // <= spin-un-lock
                        return next(err);
                      },
                      unrecognizedCredentials: function (){
                        return next({exit: 'unrecognizedCredentials'});
                      },
                      success: function (me) {
                        thisPack.linkIfNecessary({
                          type: inputs.type,
                          dir: inputs.dir,
                          keychainPath: inputs.keychainPath,
                          treelineApiUrl: inputs.treelineApiUrl
                        }).exec({
                          error: function (err) {
                            interactivePromptMightBeOpen = false; // <= spin-un-lock
                            return next(err);
                          },
                          unrecognizedCredentials: function (){
                            interactivePromptMightBeOpen = false; // <= spin-un-lock
                            return next({exit: 'unrecognizedCredentials'});
                          },
                          forbidden: function (){
                            interactivePromptMightBeOpen = false; // <= spin-un-lock
                            return next({exit: 'forbidden'});
                          },
                          success: function (linkedProject) {
                            interactivePromptMightBeOpen = false; // <= spin-un-lock

                            // Trigger optional notifier function.
                            inputs.onHasKeychain(me.username);

                            // Trigger optional notifier function.
                            inputs.onLoadProjectInfo(_.extend({
                              type: inputs.type
                            }, linkedProject.displayName || linkedProject.identity));


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

                                var socket;
                                var initialConnectHappened = false;

                                // Trigger the `onConnecting` notifier.
                                inputs.onConnecting();

                                thisPack.connectToTreeline({
                                  onSocketDisconnect:  function () {
                                    // If the connection to treeline.io is broken, trigger
                                    // the `onSocketDisconnect` notifier.
                                    inputs.onSocketDisconnect();
                                  },
                                  onSocketConnect:  function () {
                                    // If this is the first connection, ignore it--we'll handle the
                                    // initial fetch and subscribe in the "success" branch of this
                                    // ifThenFinally machine.
                                    if (!initialConnectHappened) {console.log("initial connect; returning");return;}
                                    // If the connection to treeline.io is re-established,
                                    // re-subscribe to the project.
                                    fetchAndSubscribeToProject({
                                      error: inputs.onReconnectError,
                                      success: inputs.onReconnectSuccess
                                    });
                                  },
                                  // If treeline.io says something changed, apply the changelog
                                  // it provides to our local pack on disk.
                                  toProcessChangelog: function (_inputs, exits) {
                                    // Read the link file to get the current mp hash
                                    LocalTreelineProjects.readLinkfile({
                                      dir: inputs.dir
                                    }).exec({
                                      error: inputs.onSyncError,
                                      success: function(linkedProject) {

                                        // If the hash we have for the project doesn't match what the server sent
                                        // as its previous hash value, just re-fetch the whole project and smash
                                        // everything we currently have.
                                        if (linkedProject.hashes.self.hash != _inputs.previousHash) {
                                          return fetchAndSubscribeToProject(exits);
                                        }

                                        // Trigger the `onSyncing` notifier.
                                        inputs.onSyncing();

                                        LocalTreelineProjects.syncRemoteChanges({
                                          type: inputs.type,
                                          changelog: _inputs.projectChangelog,
                                          smash: _inputs.smash,
                                          onNpmInstall: inputs.onNpmInstall,
                                          onNpmInstallError: inputs.onNpmInstallError,
                                          onNpmInstallSuccess: inputs.onNpmInstallSuccess,
                                          onSyncSuccess: inputs.onSyncSuccess,
                                          localPort: inputs.localPort,
                                          treelineApiUrl: inputs.treelineApiUrl,
                                          npmInstall: false,
                                          previewServerLifted: true
                                        }).exec({
                                          // If applying a project changelog to the local machinepack
                                          // fails, then trigger the `onSyncError` notifier function.
                                          error: function (err){
                                            inputs.onSyncError(err);
                                            // Note that this means subsequent changelogs can't be processed,
                                            // because it could get us out of sync.  So we call this lamda impl's
                                            // error exit.
                                            return exits.error(err);
                                          },
                                          // If flushing (reloading the pack in `scribe`, or flushing routes
                                          // in a Sails app)  fails, then trigger the `onFlushError` notifier function.
                                          couldNotFlush: function (err){
                                            inputs.onFlushError(err);
                                            // A flush error is not the end of the world, so we'll call the lamda
                                            // impl's success exit and keep going.
                                            return exits.success();
                                          },
                                          success: function(){
                                            // The changes were successfully synced to the local project files
                                            // on disk, which means we can call the lamda impl's success exit and
                                            // keep going.
                                            return exits.success();
                                          },
                                        });
                                      }

                                    });


                                  }, // </toProcessChangelog impl>
                                  treelineApiUrl: inputs.treelineApiUrl
                                }).exec({
                                  error: function (err) {
                                    return exits.error(err);
                                  },
                                  success: function (_socket) {

                                    // We need to use a similar queueing strategy here as we do
                                    // when applying subsequent changelogs (but better to just consolidate the logic)
                                    // This is to prevent concurrency issues between the initial synchronization
                                    // and events that come in simultaneously.
                                    // TODO

                                    // Flag the initial connection as having occurred
                                    initialConnectHappened = true;

                                    // Save our scoped socket instance
                                    socket = _socket;

                                    // Trigger optional notifier function.
                                    inputs.onInitialConnectSuccess();

                                    // Trigger the `onSyncing` notifier.
                                    inputs.onSyncing();

                                    // For app projects, ensure dependencies required to lift a Treeline-created app (Sails, machine, machine-as-action...)
                                    if (inputs.type == 'app') {
                                      // Also ensure that the package.json has all the dependencies it needs
                                      LocalApps.ensureDependencies({
                                        destination: inputs.dir
                                      }).exec({
                                        error: exits.error,
                                        success: function() {
                                          console.log("done ensuring dependenices");
                                          return fetchAndSubscribeToProject(exits);
                                        }
                                      });
                                    } else {
                                      return fetchAndSubscribeToProject(exits);
                                    }
                                  }
                                }); // </thisPack.connectToTreeline>

                                function fetchAndSubscribeToProject(exits) {

                                  // Read local pack or app (and compute hashes of meaningful information)
                                  IfThen.ifThenFinally({

                                    bool: (inputs.type === 'app'),

                                    expectedOutput: {},

                                    // If this is an app, get the app signature.
                                    then: function (__, exits) {

                                      LocalApps.getSignature({
                                        dir: inputs.dir
                                      }).exec(function (err, packSignature) {
                                        if (err) {
                                          // Ignore "notApp" errors (make up an empty signature)
                                          if (err.exit === 'notMachinepack') {
                                            packSignature = {};
                                          }
                                          // All other errors are fatal.
                                          else {
                                            return exits.error(err);
                                          }
                                        }
                                        return exits.success(packSignature);

                                      }); // </LocalApps.getSignature>

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
                                      thisPack.fetchChangesAndSubscribeToProject({
                                        socket: socket,
                                        type: inputs.type,
                                        id: linkedProject.id,
                                        secret: me.secret,
                                        machineHashes: projectSignature.machineHashes,
                                        npmDependencies: projectSignature.npmDependencies,
                                        packHash: projectSignature.packHash
                                      }).exec({
                                        error: function (err){
                                          inputs.onSyncError(err);
                                          return exits.error(err);
                                        },
                                        success: function (packChangelog){
                                          // Now subscribed.
                                          // treeline.io will respond with a full pack definition,
                                          // which we will use to replace whatever we currently have
                                          // (note the "smash: true" option)
                                          LocalTreelineProjects.syncRemoteChanges({
                                            type: inputs.type,
                                            changelog: packChangelog,
                                            onNpmInstall: inputs.onNpmInstall,
                                            onNpmInstallError: inputs.onNpmInstallError,
                                            onNpmInstallSuccess: inputs.onNpmInstallSuccess,
                                            onSyncSuccess: inputs.onSyncSuccess,
                                            localPort: inputs.localPort,
                                            treelineApiUrl: inputs.treelineApiUrl,
                                            previewServerLifted: hasLiftedPreviewServer,
                                            smash: true
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
                                          }); //</LocalTreelineProjects.syncRemoteChanges>
                                        }
                                      }); //</thisPack.fetchAndSubscribeToProject>
                                    }
                                  });

                                }
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
                        }); // </linkIfNecessary>
                      }
                    }); // </loginIfNecessary>
                  }],
                }, function afterwards(err) {

                  if (err) {

                    // 'tookTooLong' => 'requestFailed'
                    if (err.exit === 'tookTooLong') {
                      return exits.requestFailed(inputs.treelineApiUrl);
                    }

                    // 'unrecognizedCredentials' =>
                    if (err.exit === 'unrecognizedCredentials') {
                      return exits.unrecognizedCredentials();
                    }

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
                      thisPack.liftPreviewServer({
                        type: inputs.type,
                        dir: inputs.dir,
                        localPort: inputs.localPort,
                        onAppError: function(err) {
                          return exits.error(err);
                        }

                      }).exec({
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
        }); // </verifyCliCompatibility>


      }
    }); // </if offline>


  }

};



// If anything goes horribly wrong or the process is stopped manually w/ <CTRL+C>,
// then ensure we:
//  • stop listening for changes
//  • kill the local preview server
//
// (this is happening already in almost every case thanks to the `process.exit(1)`
//  we're calling in `bin/treeline-preview`. But we should make doubly sure.)



