#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Who am I?',


  description: 'Get known metadata about the Treeline account currently authenticated with this computer.',


  inputs: {},


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    success: {
      description: 'Done.',
      example: 'mikermcneil'
    },

  },


  fn: function (inputs, exits){

    var thisPack = require('../');

    thisPack.readKeychain().exec({
      error: exits.error,
      success: function (user){
        return exits.success(user.username);
      }
    });
  }


}, {
  success: function (username) {
    var chalk = require('chalk');

    console.log('This computer is logged in to Treeline as '+chalk.cyan(username)+ '.');
  }
});
