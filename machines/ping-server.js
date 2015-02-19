module.exports = {


  friendlyName: 'Ping server',


  description: 'Check that a server is alive.',

  extendedDescription: 'Makes a request to the specified URL and considers any non-zero status response proof of life.',


  inputs: {

    url: {
      description: 'The URL to ping',
      example: 'http://api.treeline.io',
      required: true
    }

  },


  defaultExit: 'alive',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    alive: {
      description: 'The server responded.'
    },

    noResponse: {
      description: 'The server did not respond.',
      example: 'http://api.treeline.io'
    }

  },


  fn: function (inputs, exits){

    var _ = require('lodash');
    var request = require('request');

    request.get(inputs.url, function(err, res, body) {
      if (err){
        if (_.isObject(err) && err.code === 'ECONNREFUSED') {
          return exits.noResponse(inputs.url);
        }
        return exits.error(err);
      }
      return exits.alive();
    });

  }


};
