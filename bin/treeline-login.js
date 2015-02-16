#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Log in',


  description: 'Authenticate this computer to access your Treeline account.',


  inputs: {

    username: {
      description: 'Your Treeline username or email address (if you signed up with GitHub, this is your GitHub username)',
      example: 'mikermcneil'
    },

    password: {
      description: 'Your Treeline password',
      example: 'sh4rkw33k',
      protect: true
    },

    baseUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io'
    }

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    success: {
      description: 'Computer is now logged in as the returned username.',
      example: 'mikermcneil'
    },

  },


  fn: function (inputs, exits){
    require('../').login(inputs).exec(exits);
  }


}, {

  success: function (username){
    var chalk = require('chalk');
    console.log('This computer is now logged in to Treeline as '+chalk.cyan(username)+ '.');
  }

});
