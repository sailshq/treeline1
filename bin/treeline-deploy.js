#!/usr/bin/env node


require('machine-as-script')({


  friendlyName: 'Deploy app',


  description: 'Deploy a Sails.js app to a hosting provider.',


  inputs: {

    keychainPath: {
      description: 'Path to the keychain file on this computer. Defaults to `.treeline.secret.json` in the home directory.',
      extendedDescription: 'If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    }

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    notLoggedIn: {
      description: 'This computer is not currently logged in to Treeline.'
    }

  },


  fn: function (inputs, exits){

    var helperPack = require('../helpers');

    helperPack.loginIfNecessary({
      keychainPath: inputs.keychainPath,
      treelineApiUrl: inputs.treelineApiUrl
    }).exec({
      error: exits.error,
      doesNotExist: exits.notLoggedIn,
      success: function (keychain){
        return exits.error(new Error('This feature is not available at this time.'));
      }
    });
  }


}).exec({

  error: function (){
    var chalk = require('chalk');
    console.log(chalk.red('Sorry, the `treeline deploy` command cannot be used during the beta.'));
    console.log('Fortunately, deploying a Treeline app is just like deploying any other Sails.js app (or Node.js app for that matter).');
    console.log('You can read more about deploying Sails.js/Treeline apps here:');
    console.log(chalk.blue(chalk.underline('http://sailsjs.org/documentation/concepts/deployment')));
    console.log();
    console.log('Please contact support@treeline.io if you need additional help getting your app running in production.');
  }

});
