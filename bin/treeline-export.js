#!/usr/bin/env node


require('../standalone/build-script')({

  args: ['id'],

  machine: {

    friendlyName: 'Export',


    description: 'Export a machinepack from Treeline into a folder of code on this computer.',


    inputs: {

      username: {
        description: 'The username of the account that owns the machinepack to export',
        extendedDescription: 'If omitted, the command-line user\'s account will be used.',
        example: 'mikermcneil/export-test'
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

      var Http = require('machinepack-http');
      var Prompts = require('machinepack-prompts');
      var Filesystem = require('machinepack-fs');
      var thisPack = require('../');
      var async = require('async');

      thisPack.readKeychain().exec({
        error: exits.error,
        doesNotExist: exits.notLoggedIn,
        success: function (keychain){

          (function obtainPack(_xits){
            // If id was explicitly specified, skip the prompting
            if (inputs.id) {
              return _xits.error(new Error('TODO: implement support for prompt-less machinepack export'));
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
              // Determine destination path
              var destinationPath = inputs.destination || path.resolve(chosenPack.displayName.toLowerCase());

              (function checkForExisting(_xits){
                // Check to see whether a file/folder already exists in cwd
                // at the destination output path. If so, let the user know what happened.
                Filesystem.exists({
                  path: destinationPath
                }).exec({
                  error: function (err){
                    return _xits.error(err);
                  },
                  exists: function (){
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
                    packId: chosenPack.id
                  }).exec({
                    error: function (err){
                      return exits.error(err);
                    },
                    success: function (packData){
                      // Generate the pack folder and machines (as well as package.json and other files)
                      thisPack.generateLocalPack({
                        destination: destinationPath,
                        packData: _.find(packData, {isMain: true}),
                        dependencyIdentifiers: _.pluck(_.where(packData, {isMain: false}), '_id'),
                        force: inputs.force
                      }).exec({
                        error: function (err){
                          return exits.error(err);
                        },
                        success: function (){
                          async.each(_.where(packData, {isMain: false}), function(pack, cb) {
                            thisPack.generateLocalDependency({
                              destination: destinationPath,
                              packData: pack,
                              force: inputs.force
                            }).exec(cb);
                          }, function(err) {
                            if (err) {return exits.error(err);}
                            return exits.success(chosenPack.displayName);
                          });
                        }
                      });// </thisPack.generateLocalPack>
                    }
                  });// </thisPack.fetchPack>
                }
              }); //</checkForExisting>
            }
          }); // </obtainPack>
        }
      }); //</thisPack.readKeychain>
    }
  }

}, {

  success: function (packName) {
    var chalk = require('chalk');
    console.log('Exported '+chalk.cyan(packName)+ ' machinepack from Treeline to a local folder.');
  },

  notLoggedIn: function () {
    var chalk = require('chalk');
    console.log('This computer is '+chalk.yellow('not logged in')+' to Treeline.');
  },

  alreadyExists: function (destinationPath){
    console.log('A file or folder with the same name as this machinepack already exists at the destination path (%s).', destinationPath);
  }

});
