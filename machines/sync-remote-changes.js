module.exports = {


  friendlyName: 'Sync remote changes',


  description: 'Apply a changelog of remote changes from treeline.io to the local project.',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project this is ("app" or "machinepack")',
      extendedDescription: 'If left unspecified, we\'ll sniff around in the directory and guess what kind of thing this is based on its package.json file.',
      example: 'machinepack'
    },

    changelog: {
      friendlyName: 'Changelog',
      description: 'A set of changes to apply to this local project.',
      example: [{}],
      required: true
    },

    onSyncSuccess: {
      description: 'An optional notifier function that will be called when Treeline attempts to sync remote changes to the local project and it works.',
      example: '->'
    },

    localPort: {
      description: 'The local port to run the preview server on (either a sails app or the `scribe` utility, depending on what is being previewed).  Defaults to 1337.',
      example: 1337,
      defaultsTo: 1337
    }

  },


  exits: {

    couldNotSync: {
      description: 'Failed to synchronize new changes from treeline.io with the local project.'
    },

    couldNotFlush: {
      description: 'Failed to flush the router of the locally-running preview app after applying changes from treeline.io.'
    }

  },


  fn: function (inputs,exits) {

    var Http = require('machinepack-http');
    var thisPack = require('../');

    // If `inputs.type` was provided, use it.
    // Otherwise, sniff around for the package.json file and figure out
    // what kind of project this is.
    thisPack.normalizeType({
      type: inputs.type
    }).exec({
      error: exits.error,
      success: function (type) {
        // Start interactive development session for either an app or a machinepack
        if (type === 'app') {
          return exits.error(new Error('New `sync-remote-changes` machine is not supported for apps yet (only machinepacks).  Please try again later!'));
        }

        thisPack.applyPackChangelog({
          changelog: inputs.changelog
        }).exec({
          error: function (err){
            console.log('ERROR:',err);
            return exits.couldNotSync(err);
          },
          success: function (){

            // Trigger the `onSyncSuccess` notifier function, if one was
            // provided.
            if (inputs.onSyncSuccess) {
              inputs.onSyncSuccess();
            }

            // Send a request to `scribe` telling it to flush its require cache
            // and pick up the new machinepack files.
            Http.sendHttpRequest({
              url: '/',
              baseUrl: 'http://localhost:'+inputs.localPort,
              method: 'get'
            }).exec({
              error: exits.couldNotFlush,
              success: function(response) {
                // Otherwise it worked and we're all good.
                return exits.success();
              }
            });
          }
        });

      }
    });

  },


};
