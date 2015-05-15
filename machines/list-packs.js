module.exports = {


  friendlyName: 'List machinepacks',


  description: 'List all Treeline machinepacks owned by the specified username.',


  cacheable: true,


  inputs: {

    secret: {
      description: 'The Treeline secret key of the account whose machinepacks will be listed.',
      example: '29f559ae-3bec-4d0a-8458-1f4e32a72407',
      protect: true,
      required: true
    },

    username: {
      description: 'The username of the Treeline account whose machinepacks will be listed.',
      example: 'mikermcneil',
      required: true
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
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
        id: 'my-cool-pack',
        displayName: 'My Cool Machinepack'
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
      baseUrl: inputs.treelineApiUrl || process.env.TREELINE_API_URL || 'https://api.treeline.io',
      url: '/api/v1/machine-packs/'+inputs.username,
      params: {},
      headers: {
       'x-auth': inputs.secret
      },
    }).exec({
      // An unexpected error occurred.
      error: function(err) {
        return exits.error(err);
      },
      // 401 status code returned from server
      unauthorized: function(result) {
        return exits.forbidden(result.body);
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

        var machinepacks;

        try {
          machinepacks = Util.parseJson({
            json: result.body,
            schema: [{
              id: 'somestring323g32',
              friendlyName: 'Some string',
              description: 'Some string like this'
            }]
          }).execSync();


          machinepacks = _.map(machinepacks, function (pack){
            return {
              id: pack.id,
              displayName: pack.friendlyName
            };
          });

          return exits.success(machinepacks);

        }
        catch (e) {
          return exits.error(e);
        }
      },
    });

  }


};
