module.exports = {


  friendlyName: 'Read keychain',


  description: 'Read data from the Treeline identity/config file.',


  inputs: {

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
    var path = require('path');
    var Paths = require('machinepack-paths');
    var Filesystem = require('machinepack-fs');

    // If specified, ensure keychainPath is an absolute path. If not specified,
    // assume the default (`~/.treeline.secret.json`)
    inputs.keychainPath = inputs.keychainPath ? path.resolve(inputs.keychainPath) : path.resolve(Paths.home().execSync(), '.treeline.secret.json');

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.readJson({
      source: inputs.keychainPath,
      schema: {
        username: 'mikermcneil',
        secret: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
      }
    }).exec(exits);

  }


};
