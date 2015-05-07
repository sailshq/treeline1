module.exports = {

  friendlyName: 'Link machinepack',


  description: 'Link the current directory to a machinepack in Treeline.',


  inputs: {

    id: {
      description: 'The id of the machinepack to link',
      example: 'f83193a9-199a3ba910-eaf1-081059b31',
      extendedDescription: 'If omitted, the command-line user will be prompted to make a choice.'
    },

    username: {
      description: 'The username of the account which owns the desired machinepack.',
      example: 'rachaelshaw',
      extendedDescription: 'If omitted, the command-line user will be the assumed owner.'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'https://api.treeline.io'
    }

  },

  exits: {

    noMachinepacks: {
      description: 'That user account doesn\'t have any accessible machinepacks.',
      example: {
        username: 'mikermcneil'
      }
    },

    forbidden: {
      description: 'Username/password combo invalid or not applicable for the selected machinepack.'
    },

    success: {
      example: {
        identity: '123',
        displayName: 'My Cool Machinepack',
        type: 'machinepack',
        owner: 'mikermcneil',
        id: '123'
      }
    }

  },


  fn: function (inputs, exits){

    var Path = require('path');
    var _ = require('lodash');
    var Prompts = require('machinepack-prompts');
    var thisPack = require('../');


    (function getMachinepackToLink(_doneGettingMachinepack){

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

          // If id was supplied, we don't need to list packs or
          // show a prompt, but we do also still need to fetch more
          // information about the machinepack.
          if (inputs.id) {
            thisPack.fetchPack({
              packId: inputs.id,
              secret: keychain.secret,
              treelineApiUrl: inputs.treelineApiUrl
            }).exec({
              error: exits.error,
              success: function (pack){
                return _doneGettingMachinepack.success({
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

          // Fetch list of machinepacks, then prompt user to choose one:
          thisPack.listPacks({
            secret: keychain.secret,
            username: inputs.username||keychain.username,
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
                  username: inputs.username || keychain.username
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

                  var packDataFromServer = (_.find(machinepacks, {
                    id: choice
                  }));

                  return _doneGettingMachinepack.success({
                    id: choice,
                    identity: choice,
                    type: 'machinepack',
                    displayName: packDataFromServer.displayName || choice,
                    owner: inputs.username||keychain.username
                  });

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
      success: function (machinepackToLink){

        thisPack.writeLinkfile(machinepackToLink).exec({
          error: function (err){
            return exits.error(err);
          },
          success: function (){
            return exits.success(machinepackToLink);
          }
        });

      }
    });


  }

};
