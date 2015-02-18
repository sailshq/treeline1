module.exports = {


  friendlyName: 'Unlink',


  description: 'Unlink the current directory from Treeline.',


  extendedDescription: '',


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

    var dir = process.cwd();

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.rmrf({
      dir: path.resolve(dir, 'treeline.json')
    }).exec(exits);
  }


};
