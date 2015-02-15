module.exports = {


  friendlyName: 'Authenticate',


  description: 'Look up the Treeline secret for the specified username/password combination.',


  extendedDescription: '',


  inputs: {

    username: {
      description: 'A Treeline username or email address',
      required: true
    },

    password: {
      description: 'The password for the Treeline account with this username',
      required: true
    },

    baseUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io'
    }

  },


  defaultExit: 'success',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    forbidden: {
      description: 'Provided secret is invalid or corrupted.  Please reauthenticate.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      description: 'Treeline secret key fetched successfully.',
      example: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
    },

  },


  fn: function (inputs, exits){

    var Http = require('machinepack-http');


    // Send an HTTP request and receive the response.
    Http.sendHttpRequest({
      method: 'put',
      baseUrl: inputs.baseUrl||'http://api.treeline.io',
      url: '/cli/login',
      params: {},
      headers: {}
    }).exec({
      // An unexpected error occurred.
      error: function(err) {
        return exits.error(err);
      },
      // 403 status code returned from server
      forbidden: function(result) {
        return exits.forbidden(result.body);
      },
      // Unexpected connection error: could not send or receive HTTP request.
      requestFailed: function() {
        return exits.requestFailed();
      },
      // OK.
      success: function(result) {
        console.log(result.body);
        return exits.success(result.body);
      },
    });

  }

};
