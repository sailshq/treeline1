#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Log in',


  description: 'Authenticate this computer to access your Treeline account.',


  inputs: {

    username: {
      description: 'Your Treeline username or email address (if you signed up with GitHub, this is your GitHub username)',
      example: 'mikermcneil',
      required: true
    },

    password: {
      description: 'Your Treeline password',
      example: 'sh4rkw33k',
      protect: true,
      required: true
    }

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    success: {
      description: 'Done.'
    },

  },


  fn: function (inputs, exits){

    var thisPack = require('../');

    thisPack.authenticate({
      username: inputs.username,
      password: inputs.password
    }).exec({
      error: exits.error,
      success: function (secret){

        thisPack.writeKeychain({
          username: inputs.username,
          secret: secret,
        }).exec({
          error: exits.error,
          success: function (){
            return exits.success();
          }
        });
      }
    });

  }


});
