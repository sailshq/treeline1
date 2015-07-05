module.exports = {


  friendlyName: 'Export pack',


  description: 'Export a machinepack from Treeline into a folder of code on this computer.',


  inputs: {

    username: {
      description: 'The username of the account that owns the machinepack to export',
      extendedDescription: 'If omitted, the command-line user\'s account will be used.',
      example: 'mikermcneil'
    },

    id: {
      description: 'The id of the machinepack to export',
      extendedDescription: 'If omitted, the command-line user will be prompted to pick from the available options.',
      example: 'mikermcneil/export-test'
    },

    destination: {
      description: 'Absolute path where the machinepack will be exported.',
      extendedDescription: 'Defaults to the machinepack\'s name (lowercased) resolved from the current working directory.  For example, if you\'ve cd\'d into your Desktop and you\'re exporting a machinepack with name "Foo", then this might default to "/Users/mikermcneil/Desktop/foo.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    force: {
      description: 'Whether to force/overwrite files that already exist at the destination',
      example: true,
      defaultsTo: false
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

    notLoggedIn: {
      description: 'This computer is not currently logged in to Treeline.'
    },

    alreadyExists: {
      description: 'A file or folder with the same name as this machinepack already exists at the destination path. Enable the `force` input and try again to overwrite.',
      example: '/Users/mikermcneil/code/foo'
    },

    success: {
      description: 'Done.'
    },

  },


  fn: function (inputs, exits){

    var path = require('path');
    var _ = require('lodash');
    var async = require('async');
    var Http = require('machinepack-http');
    var Prompts = require('machinepack-prompts');
    var Filesystem = require('machinepack-fs');
    var LocalMachinepacks = require('machinepack-localmachinepacks');
    var NPM = require('machinepack-npm');
    var thisPack = require('../');

    thisPack.readKeychain().exec({
      error: exits.error,
      doesNotExist: exits.notLoggedIn,
      success: function (keychain){

        (function obtainPack(_xits){
          // If id was explicitly supplied, we don't need to list packs or
          // show a prompt, but we do also still need to fetch more
          // information about the machinepack.
          if (inputs.id) {
            thisPack.fetchPackInfo({
              packId: inputs.id,
              secret: keychain.secret,
              treelineApiUrl: inputs.treelineApiUrl
            }).exec({
              error: exits.error,
              success: function (pack){
                return _xits.success({
                  type: 'machinepack',
                  id: pack.id,
                  identity: pack.id,
                  displayName: pack.friendlyName,
                  owner: pack.owner
                });
              }
            });
            return;
          }

          // Fetch list of machinepacks.
          thisPack.listPacks({
            username: inputs.username || keychain.username,
            secret: keychain.secret,
            treelineApiUrl: inputs.treelineApiUrl
          }).exec({

            // An unexpected error occurred.
            error: function(err) {
              return _xits.error(err);
            },

            success: function (packs){
              // Prompt user to choose the machinepack to export
              Prompts.select({
                choices: _.reduce(packs, function prepareChoicesForPrompt (memo, pack) {
                  memo.push({
                    name: pack.displayName,
                    value: pack.id
                  });
                  return memo;
                }, []),
                message: 'Which machinepack would you like to export?'
              }).exec({
                // An unexpected error occurred.
                error: function(err) {
                  return _xits.error(err);
                },
                // OK.
                success: function(chosenPackId) {
                  // Locate the pack that was chosen from the list of choices
                  var chosenPack = _.find(packs, {id: chosenPackId});
                  return _xits.success(chosenPack);
                }
              });// </Prompts.select>
            }
          });// </thisPack.listPacks>
        })({
          error: function (err){
            return exits.error(err);
          },
          success: function (chosenPack){
            // Determine destination path using the machinepack identity (if available) or its friendly name
            var destinationPath = inputs.destination || path.resolve(chosenPack.identity.split('/').pop() || chosenPack.displayName.toLowerCase());

            (function checkForExisting(_xits){
              // Check to see whether a file/folder already exists in cwd
              // at the destination output path. If so, let the user know what happened.
              Filesystem.exists({
                path: destinationPath
              }).exec({
                error: function (err){
                  return _xits.error(err);
                },
                success: function (){
                  if (!inputs.force) {
                    return _xits.alreadyExists(destinationPath);
                  }
                  return _xits.success();
                },
                doesNotExist: function (){
                  return _xits.success();
                }
              });// </Filesystem.exists>
            })({
              error: function (err){
                return exits.error(err);
              },
              alreadyExists: function (){
                return exits.alreadyExists(destinationPath);
              },
              success: function (){
                // Fetch metadata and machine code for the remote pack
                thisPack.fetchPack({
                  secret: keychain.secret,
                  packId: chosenPack.id,
                  treelineApiUrl: inputs.treelineApiUrl
                }).exec({
                  error: function (err){
                    return exits.error(err);
                  },
                  success: function (packData){

                    // Generate the pack folder and machines (as well as package.json and other files)
                    LocalMachinepacks.writePack({
                      destination: destinationPath,
                      packData: _.find(packData, {isMain: true}),
                      force: inputs.force
                    }).exec({
                      error: function (err){
                        return exits.error(err);
                      },
                      success: function (){

                        async.parallel([
                          // Install this pack's NPM dependencies
                          function (doneInstallingNPMDeps){
                            NPM.installDependencies({
                              dir: destinationPath
                            })
                            .exec(doneInstallingNPMDeps);
                          },
                          // Now install actual Treeline dependencies
                          // (fetch from treeline.io and write to local disk)
                          function (doneInstallingTreelineDeps){
                            thisPack.installTreelineDeps({
                              dir: destinationPath,
                              treelineApiUrl: inputs.treelineApiUrl
                            }).exec(doneInstallingTreelineDeps);
                          }
                        ], function afterwards(err){
                          if (err) {
                            return exits.error(err);
                          }
                          return exits.success();
                        });//</async.parallel>

                      }
                    });// </LocalMachinepacks.writePack>
                  }
                });// </fetchPack>
              }
            }); //</checkForExisting>
          }
        }); // </obtainPack>
      }
    }); //</thisPack.readKeychain>
  }
};
