#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Log in',


  description: 'Authenticate this computer to access your Treeline account.',


  inputs: {

    username: {
      description: 'Your Treeline username or email address (if you signed up with GitHub, this is your GitHub username)',
      required: true
    },

    password: {
      description: 'Your Treeline password',
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
    var Http = require('machinepack-http');

    var BASE_URL = 'http://api.treeline.io';

    // Trade username + password for secret
    Http.sendHttpRequest({
      baseUrl: BASE_URL,
      url: '/login',
      method: 'post',
      params: {
        username: inputs.username,
        password: inputs.password
      }
    }).exec({
      // An unexpected error occurred.
      error: function(err) {

      },
      // 404 status code returned from server
      notFound: function(result) {

      },
      // 400 status code returned from server
      badRequest: function(result) {

      },
      // 403 status code returned from server
      forbidden: function(result) {

      },
      // 401 status code returned from server
      unauthorized: function(result) {

      },
      // 5xx status code returned from server (this usually means something went wrong on the other end)
      serverError: function(result) {

      },
      // Unexpected connection error: could not send or receive HTTP request.
      requestFailed: function() {

      },
      // OK.
      success: function(result) {

        var secret = '';

        thisPack.writeKeychain({
          username: inputs.username,
          secret: secret,
        }).exec({
          error: exits.error,
          success: function (){
            return exits.success();
          }
        });
      },
    });

  }


});
