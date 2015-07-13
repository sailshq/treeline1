module.exports = {


  friendlyName: 'Connect to Treeline',


  description: 'Connect a client WebSocket to the Treeline mothership.',


  inputs: {

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'https://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    },

    eventListeners: {
      description: 'A mapping of event listeners for client socket events.',
      example: [
        {
          name: 'foobar',
          fn: '->'
        }
      ]
    },

    timeout: {
      description: 'The max time to wait before giving up on initial connection (in miliseconds)',
      example: 5000,
      defaultsTo: 5000
    }

  },


  exits: {

    tookTooLong: {
      description: 'The socket took too long to connect.  Are you sure your internet connection is working?  Or maybe the server is not online, or not accepting WebSocket traffic.',
      extendedDescription: 'It is also possible the server is just slow, in which case you should increase the `timeout` option.'
    },

    success: {
      description: 'Returns a Sails.js/Socket.io client socket.',
      variableName: 'socket',
      example: '==='
    },

  },


  fn: function (inputs,exits) {
    var Sockets = require('machinepack-sockets');

    Sockets.connectClientSocket({
      baseUrl: inputs.treelineApiUrl,
      timeout: inputs.timeout
    }).exec({
      error: function (err) {
        return exits.error(err);
      },
      tookTooLong: exits.tookTooLong,
      success: function (socket){
        return exits.success(socket);
      }
    });

  }


};
