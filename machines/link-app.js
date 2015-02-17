module.exports = {

  friendlyName: 'Link app',


  description: 'Link the current directory to an app or machinepack in Treeline.',


  inputs: {

    identity: {
      description: 'The identity (i.e. slug) of the machinepack or app to link',
      example: 'my-cool-app'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io'
    }

  },

  exits: {

    noApps: {
      description: 'No apps belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    success: {
      example: {
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app',
        owner: 'mikermcneil'
      }
    }

  },


  fn: function (inputs, exits){

    var _ = require('lodash');
    var Prompts = require('machinepack-prompts');
    var thisPack = require('../');


    var appToLink = {
      identity: inputs.identity
    };

    (function getAppToLink(_doneGettingApp){

      // If identity was supplied, we don't need to show a prompt, but we will eventually
      // need to fetch more information about the app.  For now, we proceed.
      if (appToLink.identity) {
        return _doneGettingApp();
      }

      (function getSecret_loginIfNecessary(_doneGettingSecret){
        // Look up the account secret
        thisPack.readKeychain().exec({
          error: function (err){ return _doneGettingSecret(err); },
          doesNotExist: function (){
            thisPack.login({
              treelineApiUrl: inputs.treelineApiUrl
            })
            .exec({
              error: function (err) {
                return _doneGettingSecret(err);
              },
              success: function (){
                thisPack.readKeychain().exec({
                  error: function (err){ return _doneGettingSecret(err); },
                  success: function (keychain){
                    return _doneGettingSecret(null, keychain);
                  }
                });
              }
            });
          },
          success: function (keychain) {
            return _doneGettingSecret(null, keychain);
          }
        });
      })(function afterwards(err, keychain){
        if (err) return _doneGettingApp(err);

        // Fetch list of apps, then prompt user to choose one:
        thisPack.listApps({
          secret: keychain.secret,
          treelineApiUrl: inputs.treelineApiUrl
        }).exec({
          error: function (err){ return _doneGettingApp(err); },
          success: function (apps){

            if (apps.length < 1) {
              return exits.noApps({
                username: keychain.username
              });
            }

            // Prompt the command-line user to make a choice from a list of options.
            Prompts.select({
              choices: _.reduce(apps, function (memo, app) {
                memo.push({
                  name: app.displayName,
                  value: app.identity
                });
                return memo;
              }, []),
              message: 'Which app would you like to link with the current directory?'
            }).exec({
              // An unexpected error occurred.
              error: function(err) {
                _doneGettingApp(err);
              },
              // OK.
              success: function(choice) {
                appToLink.identity = choice;

                var appDataFromServer = (_.find(apps, {identity: appToLink.identity}) || appToLink);
                appToLink.displayName = appDataFromServer.displayName || appToLink.identity;
                appToLink.id = appDataFromServer.id;
                _doneGettingApp();
              },
            });

          }
        });
      });

    })(function afterwards(err){
      if (err) return exits(err);

      // Get more info about the app (i.e. the owner)
      // TODO
      var owner = '[APP_OWNER]'; // e.g. 'mikermcneil';

      var linkedProjectData = {
        id: appToLink.id,
        identity: appToLink.identity,
        displayName: appToLink.displayName, // TODO: look this up when identity is provided manually w/o listing apps
        type: 'app',
        owner: owner  // TODO: get this
      };

      thisPack.writeLinkfile(linkedProjectData).exec({
        error: function (err){
          return exits.error(err);
        },
        success: function (){
          return exits.success(linkedProjectData);
        }
      });

    });


  }

};
