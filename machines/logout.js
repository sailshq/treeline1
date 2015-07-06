module.exports = {


  friendlyName: 'Logout',


  description: 'Log this computer out of Treeline.',


  extendedDescription: 'This deletes the Treeline keychain file.',


  inputs: {

    keychainPath: {
      description: 'Path to the keychain file on this computer. Defaults to `.treeline.secret.json` in the home directory.',
      extendedDescription: 'If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

  },


  exits: {
    error: {
      description: 'Unexpected error occurred.'
    },
    success: {
      description: 'Done.'
    }
  },


  fn: function (inputs, exits){
    var path = require('path');
    var Filesystem = require('machinepack-fs');
    var Paths = require('machinepack-paths');

    // If specified, ensure keychainPath is an absolute path. If not specified,
    // assume the default (`~/.treeline.secret.json`)
    inputs.keychainPath = inputs.keychainPath ? path.resolve(inputs.keychainPath) : path.resolve(Paths.home().execSync(), '.treeline.secret.json');

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.rmrf({
      dir: inputs.keychainPath,
    }).exec(exits);
  }

};
