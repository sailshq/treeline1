module.exports = {


  friendlyName: 'Preview pack',


  description: 'Preview the machinepack in the current directory, streaming down updated code as changes are made on https://treeline.io.',


  extendedDescription: 'Note that this will run the `scribe` tool as a local server (http://localhost:1492).',


  inputs: {

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

            // Read local pack
            // TODO

            // Compute hash.
            // TODO

            // Send hash of local pack to treeline.io, requesting an update
            // if anything has changed.
            // TODO

            // If treeline.io says something changed, apply the changelog
            // it provides to our local pack on disk.
            // TODO

            // Lift the `scribe` utility as a sails server running on a local port.
            // (this port should be configurable)
            // TODO

            // Now we'll start up a synchronized development session by
            // listening for changes from Treeline.
            // TODO
            var alarm = setInterval(function onChange(){
              // If treeline.io says something changed, apply the changelog
              // it provides to our local pack on disk.
              // TODO

              // Send a request to `scribe` telling it to flush its require cache
              // and pick up the new machinepack files.
              // TODO
            });

            // If anything goes wrong, or the process halts, then stop
            // listening for changes.
            // TODO
            clearInterval(alarm);

            var errMsg = '';
            errMsg += '\n';
            errMsg += 'Sorry-- interactive pack preview is not implemented yet.';
            errMsg += '\n';
            errMsg +=  'But we\'re working on it!  If you\'re curious, keep an eye on the repo for updates:';
            errMsg += '\n';
            errMsg += 'http://github.com/treelinehq/treeline';
            return exits.error(errMsg);
          }
        });
      }
    });

  }

};
