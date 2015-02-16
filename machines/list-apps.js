module.exports = {


  friendlyName: 'List apps',


  description: 'List all Treeline apps owned by the user with the specified secret.',


  extendedDescription: '',


  inputs: {

    secret: {
      description: 'The Treeline secret key of the account whose apps will be listed.',
      example: '29f559ae-3bec-4d0a-8458-1f4e32a72407',
      protect: true,
      required: true
    },

    baseUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'https://api.treeline.io'
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
      description: 'Done.',
      example: [{
        identity: 'my-cool-app',
        displayName: 'My Cool App'
      }]
    }

  },


  fn: function (inputs, exits){

    var _ = require('lodash');
    var Http = require('machinepack-http');
    var Util = require('machinepack-util');


    // Send an HTTP request and receive the response.
    Http.sendHttpRequest({
      method: 'get',
      baseUrl: inputs.baseUrl||'https://api.treeline.io',
      url: '/cli/apps',
      params: {},
      headers: {
       'x-auth': inputs.secret
      },
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

        var apps;

        try {
          apps = Util.parseJson({
            json: result.body,
            schema: [{
              fullName: 'some-string-like-this',
              name: 'Some string like this'
            }]
          }).execSync();

          apps = _.map(apps, function (app){
            return {
              identity: app.fullName,
              displayName: app.name
            };
          });

          return exits.success(apps);

        }
        catch (e) {
          return exits.error(e);
        }
      },
    });

  }


};
