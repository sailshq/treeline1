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


    var username = inputs.username;
    var password = inputs.password;

    async.series([
      function (next){
        if (username) return next();
        Prompts.text({
          message: 'Please enter your Treeline username or email address'// (if you signed up with GitHub, this is your GitHub username)'
        }).exec({
          error: next,
          success: function (_username){
            username = _username;
            return next();
          }
        });
      },
      function (next){
        if (password) return next();
        Prompts.text({
          message: 'Please enter your Treeline password',
          protect: true
        }).exec({
          error: next,
          success: function (_password){
            password = _password;
            return next();
          }
        });
      }
    ], function (err){
      if (err) return exits.error(err);

      thisPack.authenticate({
        username: username,
        password: password,
        baseUrl: inputs.treelineApiUrl
      }).exec({
        error: exits.error,
        fobidden: exits.forbidden,
        requestFailed: exits.requestFailed,
        success: function (secret){

          thisPack.writeKeychain({
            username: username,
            secret: secret,
          }).exec({
            error: exits.error,
            success: function (){
              return exits.success({
                username: username,
                secret: secret
              });
            }
          });
        }
      });
    });

  }

};
