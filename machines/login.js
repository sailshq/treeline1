module.exports = {


  friendlyName: 'Log in',


  description: 'Authenticate this computer to access your Treeline account.',


  inputs: {

    username: {
      description: 'Your Treeline username or email address',
      extendedDescription: 'If you signed up with GitHub, this is your GitHub username.',
      example: 'mikermcneil'
    },

    password: {
      description: 'Your Treeline password',
      example: 'sh4rkw33k',
      protect: true
    },

    adminToken: {
      description: 'The token to use to verify an admin that can sync code to debug compiler issues',
      example: 'abc-123',
      protect: true
    },

    keychainPath: {
      description: 'Path to the keychain file on this computer. Defaults to `.treeline.secret.json` in the home directory.',
      extendedDescription: 'If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io'
    }

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    forbidden: {
      description: 'Unrecognized username/password combination.',
      extendedDescription: 'Please try again or visit http://treeline.io to reset your password or locate your username.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      description: 'Computer is now logged in as the returned username.',
      example: {
        username: 'mikermcneil',
        secret: 'foasdgaj382913'
      }
    },

  },

  fn: function (inputs, exits){
    var async = require('async');
    var Prompts = require('machinepack-prompts');
    var thisPack = require('../');


    async.series([
      function (next){
        if (inputs.username) {
          return next();
        }

        // Set a different message if an admin is authenticating
        var message = '';

        if(inputs.adminToken) {
          message = 'Please enter the username of the user to authenticate as';
        } else {
          message = 'Please enter your Treeline username or email address';
        }

        Prompts.text({
          message: message
        }).exec({
          error: next,
          success: function (_username){
            username = _username;
            return next();
          }
        });
      },
      function (next){
        if (inputs.password || inputs.adminToken) return next();
        Prompts.text({
          message: 'Please enter your Treeline password',
          protect: true
        }).exec({
          error: next,
          success: function (_password){
            inputs.password = _password;
            return next();
          }
        });
      }
    ], function (err){
      if (err) return exits.error(err);

      thisPack.authenticate({
        username: inputs.username,
        password: inputs.password,
        adminToken: inputs.adminToken,
        treelineApiUrl: inputs.treelineApiUrl,
      }).exec({
        error: exits.error,
        fobidden: exits.forbidden,
        requestFailed: exits.requestFailed,
        success: function (secret){

          thisPack.writeKeychain({
            username: inputs.username,
            secret: secret,
            keychainPath: inputs.keychainPath
          }).exec({
            error: exits.error,
            success: function (){
              return exits.success({
                username: inputs.username,
                secret: secret
              });
            }
          });
        }
      });
    });

  }

};
