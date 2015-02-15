module.exports = {


  friendlyName: 'Read linkfile',


  description: 'Read data from the linkfile in the current directory.',


  inputs: {},


  defaultExit: 'success',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    success: {
      description: 'Done.',
      example: {
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app'
      }
    },

  },


  fn: function(inputs, exits) {
    var path = require('path');
    var Filesystem = require('machinepack-fs');
    var dir = process.cwd();

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.readJson({
      source: path.resolve(dir, '.treeline.json'),
      schema: {
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app'
      }
    }).exec(exits);
  }


};
