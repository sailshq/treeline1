module.exports = {


  friendlyName: 'Write keychain',


  description: 'Write or overwrite the Treeline keychain/identity/config file.',


  inputs: {

    username: {
      description: 'The username to write to the keychain file.',
      example: 'mikermcneil',
      required: true
    },

    secret: {
      description: 'The secret to write to the keychain file',
      example: '29f559ae-3bec-4d0a-8458-1f4e32a72407',
      required: true
    }

  },


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    success: {
      description: 'Done.'
    },

  },


  fn: function(inputs, exits) {
    var path = require('path');
    var Filesystem = require('machinepack-fs');
    var Paths = require('machinepack-paths');

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.writeJson({
      // Allow the destination to be overridden by an environment var
      destination: process.env.TREELINE_KEYCHAIN || path.resolve(Paths.home().execSync(), '.treeline.secret.json'),
      force: true,
      json: {
        username: inputs.username,
        secret: inputs.secret
      }
    }).exec(exits);
  }


};
