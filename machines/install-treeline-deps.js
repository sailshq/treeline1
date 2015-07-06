module.exports = {


  friendlyName: 'Install Treeline dependencies',


  description: 'Install Treeline pack dependencies for the specified pack.',


  inputs: {

    dir: {
      description: 'Path to the local machinepack where the dependencies should be installed.',
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

    success: {
      description: 'Done.',
    },

  },


  fn: function (inputs,exits) {
    var path = require('path');
    var async = require('async');
    var _ = require('lodash');
    var LocalMachinepacks = require('machinepack-localmachinepacks');
    var Http = require('machinepack-http');
    var Filesystem = require('machinepack-fs');
    var NPM = require('machinepack-npm');
    var thisPack = require('../');
    var debug = require('debug')('treeline-cli');

    // Ensure we have an absolute destination path.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    debug('running `install-treeline-deps`');

    // Look up user credentials from a keychain file
    thisPack.readKeychain({
      keychainPath: inputs.keychainPath
    }).exec({
      error: exits.error,
      doesNotExist: function () {
        return exits.error('Cannot install dependencies because the keychain file cannot be found.  Please run `treeline login` on the command-line to authenticate this computer with your Treeline account.');
      },
      success: function (keychain) {

        // Look up this pack or app's id from its linkfile.
        thisPack.readLinkfile({
          dir: inputs.dir
        }).exec({
          error: exits.error,
          doesNotExist: function () {
            return exits.error('Cannot install dependencies because a linkfile (i.e. `treeline.json`) does not exist in this directory.  Please associate this directory with a Treeline project by running `treeline link` on the command-line.');
          },
          success: function (projectInfo){
            debug('Using project info:',projectInfo);

            // Hit Treeline.io to fetch and export the deep dependencies for this project.
            // Because the packs are flattened, this includes nested dependencies as well
            // as top-level dependencies of this project.
            var url = '/api/v1/machinepacks/'+projectInfo.id+'/dependencies';
            debug('Communicating w/ '+inputs.treelineApiUrl+url);
            Http.sendHttpRequest({
              method: 'get',
              baseUrl: inputs.treelineApiUrl,
              url: url,
              headers: { 'x-auth': keychain.secret },
            }).exec({
              error: exits.error,
              success: function (response){
                var exportedDependencyPacks;
                try {
                  exportedDependencyPacks = JSON.parse(response.body);
                }
                catch (e) {
                  return exits.error(e);
                }

                debug('Got exported dependency packs:',exportedDependencyPacks);


                // Now loop over each of pack's dependency packs and write
                // the "real" exported pack files to disk.
                async.each(exportedDependencyPacks, function(pack, next) {

                  // Validate that the "npmPackageName" exists and doesn't contain any underscores.
                  // (use the `id` as the npm package name if no package name is provided)
                  pack.npmPackageName = pack.npmPackageName || pack.id;
                  pack.npmPackageName = pack.npmPackageName.replace(/_/g,'-');
                  // TODO: enforce both things (^^) in the API when `npmPackageName`s
                  // are initially set or modified (including if/when they are inferred)

                  // Create a modified "npmPackageName" which includes the version string
                  // as a suffix (e.g. `rachaelshaw/machinepack-foobar_1.5.39`)
                  var versionSpecificPkgName = pack.npmPackageName + '_' + pack.version;

                  // If this is a direct, "shallow" (version-agnostic) dependency,
                  // also write a stub pack for it as an alias to the proper version
                  // (by simply requiring it).  This is to allow analog machines to work.
                  thisPack.writeAliasDependency({
                    dir: path.join(inputs.dir,'machines',pack.npmPackageName),
                    packData: pack,
                    // Eventually, we'll be able to just use a normal require(), since all of the
                    // dependencies will be in a `node_modules` folder.  However, for now, we need
                    // to use a relative path.
                    // TODO: update this when that happens
                    requireStr: '../'+versionSpecificPkgName
                  }).exec({
                    error: function (err) { return next(err); },
                    success: function () {

                      // Write the "real" exported pack dependency release to disk
                      // TODO: Write this in the node_modules folder once the relevant updates
                      // have been made in the compiler.  The current strategy of writing
                      // to the machines folder and concatenating the version is purely
                      // temporary.
                      LocalMachinepacks.writePack({
                        destination: path.join(inputs.dir,'machines',versionSpecificPkgName),
                        packData: _.extend({}, pack, {
                          // Pass in a modified version of the pack w/ the tweaked pkg name.
                          npmPackageName: versionSpecificPkgName
                        }),
                        force: true
                      }).exec({
                        error: function (err){
                          return next(err);
                        },
                        success: function (){

                          async.parallel([
                            function (doneInstallingNPMDeps){
                              // Install NPM dependencies for this treeline pack dependency
                              NPM.installDependencies({
                                dir: path.join(inputs.dir,'machines',versionSpecificPkgName)
                              })
                              .exec({
                                error: function (err){ return doneInstallingNPMDeps(err); },
                                success: function (){
                                  return doneInstallingNPMDeps();
                                }
                              });
                            },
                            function (doneInstallingTreelineDeps){
                              // For ALL of this dependency's stated top-level treeline dependencies,
                              // write stub packs to disk that simply require the appropriate version
                              // from the top-level pack.
                              async.each(pack.treelineDependencies, function (depOfDepMapping, next) {

                                // Look up additional information about this dependency from the flat
                                // list of top-level dependencies we've been using above
                                var deepDepPack = _.find(exportedDependencyPacks, {
                                  id: depOfDepMapping.id,
                                  version: depOfDepMapping.version
                                });

                                // If this dependency does not exist in this list, we have a problem.
                                if (!deepDepPack) {
                                  return next(new Error('Consistency violation: Unexpected dependency id/version combination ("'+depOfDepMapping.id+'@'+depOfDepMapping.version+'")'));
                                }


                                // Finally, write the alias pack to disk.
                                thisPack.writeAliasDependency({
                                  dir: path.join(inputs.dir,'machines',versionSpecificPkgName,'node_modules',deepDepPack.npmPackageName),
                                  packData: deepDepPack,
                                  // Eventually, we'll be able to just use a normal require(), since all of the
                                  // dependencies will be in a `node_modules` folder.  However, for now, we need
                                  // to use a relative path.
                                  // TODO: update this when that happens
                                  requireStr: '../../../'+deepDepPack.npmPackageName+'_'+deepDepPack.version
                                }).exec({
                                  error: function (err) { return next(err); },
                                  success: function () { return next(); }
                                });
                              }, function afterwards (err) {
                                if (err) { return doneInstallingTreelineDeps(err); }
                                return doneInstallingTreelineDeps();
                              }); //</async.each dependency of dependency>
                            }
                          ], function afterwards (err){
                            if (err) {
                              return next(err);
                            }
                            return next();
                          }); //</async.parallel>
                        }
                      });// </write treeline dependency to local disk>
                    }
                  });

                }, function afterwards(err){
                  if (err) {
                    return exits.error(err);
                  }
                  return exits.success();
                }); //</async.each dependency>
              }
            });
          }
        });
      }
    });

  },


};
