#!/usr/bin/env node


require('machine-as-script')({


  friendlyName: 'Who am I?',


  description: 'Get known metadata about the Treeline account currently authenticated with this computer.',


  inputs: {},


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    notLoggedIn: {
      description: 'This computer is not currently logged in to Treeline.'
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
      doesNotExist: exits.notLoggedIn,
      success: function (user){
        return exits.success(user.username);
      }
    });
  }


}).exec({

  success: function (username) {
    var chalk = require('chalk');
    console.log('This computer is logged in to Treeline as '+chalk.cyan(username)+ '.');
  },

  notLoggedIn: function () {
    var chalk = require('chalk');
    console.log('This computer is '+chalk.yellow('not logged in')+' to Treeline.');
  },

});
