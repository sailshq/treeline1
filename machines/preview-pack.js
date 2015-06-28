module.exports = {


  friendlyName: 'Preview pack',


  description: 'Preview the machinepack in the current directory, streaming down updated code as changes are made on https://treeline.io.',


  extendedDescription: 'Note that this will run the `scribe` tool as a local server (http://localhost:1492).',


  inputs: {

    onAuthenticated: {
      description: 'An optional notifier function that will be called when authentication is complete.',
      example: '->'
    },

    onConnected: {
      description: 'An optional notifier function that will be called when a connection is established with Treeline.io and this pack is being initially synchronized with the server.',
      example: '->'
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

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
    },

    noMachinepacks: {
      description: 'No machinepacks belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    forbidden: {
      description: 'Unrecognized username/password combination.',
      extendedDescription: 'Please try again or visit http://treeline.io to reset your password or locate your username.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      description: 'Done.',
      example: '==='
    },

  },


  fn: function (inputs, exits){

    var thisPack = require('../');
    var getSocketAndConnect = require('../standalone/sails-client');

    thisPack.loginIfNecessary({
      treelineApiUrl: inputs.treelineApiUrl
    }).exec({
      error: exits.error,
      success: function (me) {
        thisPack.linkIfNecessary({
          type: 'machinepack',
          treelineApiUrl: inputs.treelineApiUrl
        }).exec({
          error: exits.error,
          success: function (linkedProject) {
            if (linkedProject.type !== 'machinepack') {
              return exits.error('The Treeline project in this directory is not a machinepack.  Maybe try `treeline preview app` instead?');
            }

            // Trigger optional notifier function.
            if (inputs.onAuthenticated) {
              inputs.onAuthenticated();
            }

            // Lift the `scribe` utility as a sails server running on a local port.
            // (this port should be configurable)
            // TODO

            // Read local pack and compute hash.
            // TODO

            // Now we'll start up a synchronized development session by
            // listening for changes from Treeline by first connecting a socket,
            // then sending a GET request to subscribe to this particular pack.
            // With that request, send hash of local pack to treeline.io, requesting
            // an update if anything has changed (note that this will also subscribe
            // our socket to future changes)
            // TODO
            getSocketAndConnect({
              baseUrl: inputs.treelineApiUrl
            }, function (err, socket) {
              if (err) {
                return exits.error(err);
              }

              // Trigger optional notifier function.
              if (inputs.onConnected) {
                inputs.onConnected();
              }

              socket.request({
                method: 'get',
                url: '/api/v1/machine-packs/rachaelshaw',
                headers: { 'x-profile': 'rachaelshaw' },
                params: {}
              }, function serverResponded (body, JWR) {
                // console.log('Sails responded with: ', body); console.log('with headers: ', JWR.headers); console.log('and with status code: ', JWR.statusCode);
                // console.log('JWR.error???',JWR.error);
                if (JWR.error) {
                  return exits.error(JWR.error);
                }

                // If treeline.io says something changed, immediately apply the changelog
                // it provides to our local pack on disk
                // TODO

                // Send a request to `scribe` telling it to flush its require cache
                // and pick up the new machinepack files.
                // TODO

                var errMsg = '';
                errMsg += '\n';
                errMsg += 'Sorry-- interactive pack preview is not implemented yet.';
                errMsg += '\n';
                errMsg +=  'But we\'re working on it!  If you\'re curious, keep an eye on the repo for updates:';
                errMsg += '\n';
                errMsg += 'http://github.com/treelinehq/treeline';
                return exits.error(errMsg);
              });

              // If treeline.io says something changed, apply the changelog
              // it provides to our local pack on disk.
              socket.on('pack:changed', function (msg){
                // TODO
              });

              // If anything goes wrong (e.g. the connection to treeline.io is broken)
              // or the process is stopped manually w/ <CTRL+C>, then:
              //  • stop listening for changes
              //  • kill the local server running `scribe`
              // TODO
              socket.on('disconnect', function() {
                console.error();
                console.error('Whoops, looks like you\'ve lost connection to the internet.  Would you check your connection and try again?  While unlikely, it is also possible that the Treeline mothership went offline (i.e. our servers are down.)  If you\'re having trouble reconnecting and think that might be the case, please send us a note at support@treeline.io.  Thanks!');
                console.error('Attempting to reconnect...   (press <CTRL+C> to quit)');
              });
            });

          }
        });
      }
    });

  }

};
