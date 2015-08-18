#!/usr/bin/env node


require('machine-as-script')({


  friendlyName: 'Who am I?',


  description: 'Get known metadata about the Treeline account currently authenticated with this computer.',


  inputs: {

    keychainPath: {
      description: 'Path to the keychain file on this computer. Defaults to `.treeline.secret.json` in the home directory.',
      extendedDescription: 'If provided as a relative path, this will be resolved from the current working directory.',
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

    success: {
      description: 'Done.',
      example: 'mikermcneil'
    },

  },


  fn: function (inputs, exits){

    var helperPack = require('../helpers');
    var LocalTreelineProjects = require('machinepack-local-treeline-projects');

    LocalTreelineProjects.readKeychain({
      keychainPath: inputs.keychainPath
    }).exec({
      error: exits.error,
      doesNotExist: exits.notLoggedIn,
      success: function (keychain){
        return exits.success(keychain.username);
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
