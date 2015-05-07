#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Export',


  description: 'Export a machinepack from Treeline into a folder of code on this computer.',


  inputs: {

    destination: {
      description: 'Absolute path where the machinepack will be exported.',
      extendedDescription: 'Defaults to the machinepack\'s name (lowercased) resolved from the current working directory.  For example, if you\'ve cd\'d into your Desktop and you\'re exporting a machinepack with name "Foo", then this might default to "/Users/mikermcneil/Desktop/foo.',
      example: '/Users/mikermcneil/Desktop/foo'
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
      description: 'A file or folder with the same name as this machinepack already exists at the destination path.',
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

        // Fetch list of machinepacks.
        thisPack.listPacks({
          username: keychain.username,
          secret: keychain.secret,
          treelineApiUrl: inputs.treelineApiUrl
        }).exec({

          // An unexpected error occurred.
          error: function(err) {
            return exits.error(err);
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
                return exits.error(err);
              },
              // OK.
              success: function(chosenPackId) {

                // Locate the pack that was chosen from the list of choices
                var chosenPack = _.find(packs, {id: chosenPackId});

                // Determine destination path
                var destinationPath = inputs.destination || path.resolve(chosenPack.friendlyName.toLowerCase());

                // Check to see whether a file/folder already exists in cwd
                // at the destination output path. If so, let the user know what happened.
                Filesystem.exists({
                  path: destinationPath
                }).exec({
                  error: function (err){
                    return exits.error(err);
                  },
                  exists: function (){
                    return exits.alreadyExists(destinationPath);
                  },
                  doesNotExist: function (){

                    // Fetch metadata and machine code for the remote pack
                    thisPack.fetchPack({
                      secret: keychain.secret,
                      packId: chosenPackId
                    }).exec({
                      error: function (err){
                        return exits.error(err);
                      },
                      success: function (packData){
                        // Generate the pack folder and machines (as well as package.json and other files)
                        thisPack.generateLocalPack({
                          destination: destinationPath,
                          packData: _.find(packData, {isMain: true}),
                          dependencyIdentifiers: _.pluck(_.where(packData, {isMain: false}), '_id')
                        }).exec({
                          error: function (err){
                            return exits.error(err);
                          },
                          success: function (){
                            async.each(_.where(packData, {isMain: false}), function(pack, cb) {
                              thisPack.generateLocalDependency({
                                destination: destinationPath,
                                packData: pack
                              }).exec(cb);
                            }, function(err) {
                              if (err) {return exits.error(err);}
                              return exits.success(chosenPack.friendlyName);
                            });
                          }
                        });// </thisPack.generateLocalPack>
                      }
                    });// </thisPack.fetchPack>
                  }
                });// </Filesystem.exists>
              }
            });// </Prompts.select>
          }
        });// </thisPack.listPacks>
      }
    });
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
