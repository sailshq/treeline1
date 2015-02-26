module.exports = {


  friendlyName: 'Read keychain',


  description: 'Read data from the Treeline identity/config file.',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    doesNotExist: {
      description: 'Keychain file does not exist.'
    },

    couldNotParse: {
      description: 'Keychain file is corrupted (cannot be parsed as JSON).'
    },

    success: {
      description: 'Done.',
      example: {
        username: 'mikermcneil',
        secret: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
      }
    },

  },


  fn: function(inputs, exits) {

    // Return values from env vars if they exist
    if (process.env.TREELINE_USERNAME && process.env.TREELINE_SECRET) {
      return setImmediate(function() {
        return exits.success({
          username: process.env.TREELINE_USERNAME,
          secret: process.env.TREELINE_SECRET
        });
      });
    }

    var path = require('path');
    var Filesystem = require('machinepack-fs');

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.readJson({
      // Allow the source to be overridden by an environment var
      source: process.env.TREELINE_KEYCHAIN || path.resolve(Filesystem.getHomeDirpath().execSync(), '.treeline.secret.json'),
      schema: {
        username: 'mikermcneil',
        secret: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
      }
    }).exec(exits);

  }


};
