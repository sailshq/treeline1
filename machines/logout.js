module.exports = {


  friendlyName: 'Logout',


  description: 'Log this computer out of Treeline.',


  extendedDescription: 'This deletes the Treeline keychain file in your home directory.',


  inputs: {},


  defaultExit: 'success',


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

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.rmrf({
      dir: path.resolve(Paths.home().execSync(), '.treeline.secret.json'),
    }).exec(exits);
  }

};
