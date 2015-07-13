module.exports = {


  friendlyName: 'Ping server',


  description: 'Check that a server is alive by sending a request to the given URL.',


  extendedDescription: 'Makes a request to the specified URL and considers any non-zero status response proof of life.',


  inputs: {

    url: {
      description: 'The URL to ping.',
      example: 'https://api.treeline.io',
      required: true
    }

  },


  exits: {

    success: {
      friendlyName: 'alive',
      description: 'The server responded.'
    },

    noResponse: {
      description: 'The server did not respond.'
    }

  },


  fn: function (inputs, exits){
    var _ = require('lodash');
    var request = require('request');

    // TODO: digitize

    request.get(inputs.url, function(err, res, body) {
      if (err){
        if (_.isError(err) && err.code === 'ECONNREFUSED') {
          return exits.noResponse();
        }
        return exits.error(err);
      }
      return exits.success();
    });

  }


};
