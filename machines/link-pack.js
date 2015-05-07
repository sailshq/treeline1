module.exports = {

  friendlyName: 'Link machinepack',


  description: 'Link the current directory to a machinepack in Treeline.',


  inputs: {

    identity: {
      description: 'The identity (i.e. slug) of the machinepack to link',
      example: 'my-cool-machinepack',
      extendedDescription: 'If omitted, the command-line user will be prompted to make a choice.'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io'
    }

  },

  exits: {

    noMachinepacks: {
      description: 'No machinepacks belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    forbidden: {
      description: 'Username/password combo invalid or not machinepacklicable for the selected machinepack.'
    },

    success: {
      example: {
        identity: 'my-cool-machinepack',
        displayName: 'My Cool Machinepack',
        type: 'machinepack',
        owner: 'mikermcneil',
        id: 123
      }
    }

  },


  fn: function (inputs, exits){

    var _ = require('lodash');
    var Prompts = require('machinepack-prompts');
    var thisPack = require('../');
    var request = require("request");
    var Path = require('path');
    var Tar = require('tar.gz');

    var machinepackToLink = {
      identity: inputs.identity
    };

    (function getMachinepackToLink(_doneGettingMachinepack){

      // If identity was supplied, we don't need to show a prompt, but we will eventually
      // need to fetch more information about the machinepack.  For now, we proceed.
      if (machinepackToLink.identity) {
        return _doneGettingMachinepack.success();
      }

      (function getSecret_loginIfNecessary(_doneGettingSecret){
        // Look up the account secret
        thisPack.readKeychain().exec({
          error: function(err) {
            return _doneGettingSecret.error(err);
          },
          doesNotExist: function (){
            thisPack.login({
              treelineApiUrl: inputs.treelineApiUrl || process.env.TREELINE_API_URL
            })
            .exec({
              error: function (err) {
                return _doneGettingSecret.error(err);
              },
              forbidden: function (){
                return _doneGettingSecret.forbidden();
              },
              success: function (){
                thisPack.readKeychain().exec({
                  error: function(err) {
                    return _doneGettingSecret.error(err);
                  },
                  success: function (keychain){
                    return _doneGettingSecret.success(keychain);
                  }
                });
              }
            });
          },
          success: function (keychain) {
            return _doneGettingSecret.success(keychain);
          }
        });
      })({
        error: function (err){
          return _doneGettingMachinepack.error(err);
        },
        forbidden: function (){
          return _doneGettingMachinepack.forbidden();
        },
        success: function (keychain) {

          // Fetch list of machinepacks, then prompt user to choose one:
          thisPack.listPacks({
            secret: keychain.secret,
            username: keychain.username,
            treelineApiUrl: inputs.treelineApiUrl
          }).exec({
            error: function(err) {
              return _doneGettingMachinepack.error(err);
            },
            forbidden: function (){
              return _doneGettingMachinepack.forbidden();
            },
            success: function(machinepacks) {
              if (machinepacks.length < 1) {
                return _doneGettingMachinepack.noMachinepacks({
                  username: keychain.username
                });
              }

              // Prompt the command-line user to make a choice from a list of options.
              Prompts.select({
                choices: _.reduce(machinepacks, function(memo, machinepack) {
                  memo.push({
                    name: machinepack.displayName,
                    value: machinepack.id
                  });
                  return memo;
                }, []),
                message: 'Which machinepack would you like to link with the current directory?'
              }).exec({
                // An unexpected error occurred.
                error: function(err) {
                  _doneGettingMachinepack.error(err);
                },
                // OK.
                success: function(choice) {
                  machinepackToLink.id = choice;

                  var machinepackDataFromServer = (_.find(machinepacks, {
                    id: machinepackToLink.id
                  }) || machinepackToLink);
                  machinepackToLink.displayName = machinepackDataFromServer.displayName || machinepackToLink.id;
                  machinepackToLink.id = machinepackDataFromServer.id;

                  _doneGettingMachinepack.success();

                },
              });
            }
          });
        }
      });

    })({
      error: function (err){
        return exits(err);
      },
      forbidden: function (){
        return exits.forbidden();
      },
      noMachinepacks: function (me){
        return exits.noMachinepacks(me);
      },
      success: function (){

        // Get more info about the machinepack (i.e. the owner)
        // TODO
        var owner = '[PACK_OWNER]'; // e.g. 'mikermcneil';

        var linkedPackData = {
          id: machinepackToLink.id, // TODO: look this up when identity is provided manually w/o listing machinepacks
          identity: machinepackToLink.id,
          displayName: machinepackToLink.displayName, // TODO: look this up when identity is provided manually w/o listing machinepacks
          type: 'machinepack',
          owner: owner  // TODO: get this
        };

        thisPack.writeLinkfile(linkedPackData).exec({
          error: function (err){
            return exits.error(err);
          },
          success: function (){
            return exits.success(linkedPackData);
          }
        });

      }
    });


  }

};
