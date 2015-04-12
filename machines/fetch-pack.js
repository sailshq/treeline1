module.exports = {


  friendlyName: 'Fetch machinepack',


  description: 'Fetch the specified machinepack metadata and code from Treeline.',


  extendedDescription: '',


  cacheable: true,


  inputs: {

    secret: {
      description: 'The Treeline secret key of the account (for authentication.)',
      example: '29f559ae-3bec-4d0a-8458-1f4e32a72407',
      protect: true,
      required: true
    },

    packId: {
      description: 'The unique id of the machinepack.',
      example: 'b467be95-c69f-43c3-afdd-2b12c5a51360',
      required: true
    },

    treelineApiUrl: {
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
      description: 'You don\'t have access to the pack you\'re requesting.',
      extendedDescription: 'The provided secret might be invalid or corrupted. Please check that you have access to the pack you\'re requesting or reauthenticate.'
    },

    notFound: {
      description: 'No machinepack with that id exists.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      description: 'Done.',
      example: {
        friendlyName: 'Foo',
        description: 'Node.js utilities for working with foos.',
        author: 'Marty McFly <marty@mcfly.com>',
        license: 'MIT',
        version: '0.5.17',
        identity: 'bc231894d-194ab1-49284e9af-28401fbc1d',
        dependencies: [ { name: 'lodash', semverRange: '^2.4.1' } ],
        machines: [{
          identity: 'do-stuff',
          friendlyName: 'Do stuff and things',
          description: 'Do stuff given other stuff.',
          extendedDescription: 'Do stuff to the stuff given the other stuff.  If the stuff doesn\'t get done the first time, try it again up to 50 times using an exponential backoff strategy.',
          cacheable: false,
          environment: ['req'],
          inputs: {},
          exits: {},
          fn: 'some stringified function',
        }]
      }
    }

  },


  fn: function (inputs, exits){

    // Stub for now:
    return exits.success({
      friendlyName: 'Foo',
      description: 'Node.js utilities for working with foos.',
      author: 'Marty McFly <marty@mcfly.com>',
      license: 'MIT',
      version: '0.5.17',
      identity: 'bc231894d-194ab1-49284e9af-28401fbc1d',
      dependencies: [ { name: 'lodash', semverRange: '^2.4.1' } ],
      machines: [{
        identity: 'do-stuff',
        friendlyName: 'Do stuff and things',
        description: 'Do stuff given other stuff.',
        extendedDescription: 'Do stuff to the stuff given the other stuff.  If the stuff doesn\'t get done the first time, try it again up to 50 times using an exponential backoff strategy.',
        cacheable: false,
        environment: ['req'],
        inputs: {},
        exits: {},
        fn: 'some stringified function',
      }]
    });

    var _ = require('lodash');
    var Http = require('machinepack-http');
    var Util = require('machinepack-util');

    // Send an HTTP request and receive the response.
    Http.sendHttpRequest({
      method: 'get',
      baseUrl: inputs.treelineApiUrl || process.env.TREELINE_API_URL || 'https://api.treeline.io',
      url: '/machinepacks/export',
      params: {
        id: inputs.packId
      },
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
      // 404 status code returned from server
      notFound: function(result) {
        return exits.notFound(result.body);
      },
      // Unexpected connection error: could not send or receive HTTP request.
      requestFailed: function() {
        return exits.requestFailed();
      },
      // OK.
      success: function(result) {

        var pack;

        try {
          pack = Util.parseJson({
            json: result.body,
            schema: {
              friendlyName: 'Foo',
              description: 'Node.js utilities for working with foos.',
              author: 'Marty McFly <marty@mcfly.com>',
              license: 'MIT',
              version: '0.5.17',
              identity: 'bc231894d-194ab1-49284e9af-28401fbc1d',
              dependencies: [ { name: 'lodash', semverRange: '^2.4.1' } ],
              machines: [{
                identity: 'do-stuff',
                friendlyName: 'Do stuff and things',
                description: 'Do stuff given other stuff.',
                extendedDescription: 'Do stuff to the stuff given the other stuff.  If the stuff doesn\'t get the first time, try it again up to 50 times using an exponential backoff strategy.',
                cacheable: false,
                environment: ['req'],
                inputs: {},
                exits: {},
                fn: 'some stringified function',
              }]
            }
          }).execSync();
        }
        catch (e) {
          return exits.error(e);
        }

        return exits.success(pack);
      },
    });

  }


};
