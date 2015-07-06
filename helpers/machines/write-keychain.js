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
    },

    keychainPath: {
      description: 'Path to the keychain file on this computer. Defaults to `.treeline.secret.json` in the home directory.',
      extendedDescription: 'If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

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

    // If specified, ensure keychainPath is an absolute path. If not specified,
    // assume the default (`~/.treeline.secret.json`)
    inputs.keychainPath = inputs.keychainPath ? path.resolve(inputs.keychainPath) : path.resolve(Paths.home().execSync(), '.treeline.secret.json');

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.writeJson({
      // Allow the destination to be overridden by an environment var
      destination: inputs.keychainPath,
      force: true,
      json: {
        username: inputs.username,
        secret: inputs.secret
      }
    }).exec(exits);
  }


};
