module.exports = {


  friendlyName: 'Read linkfile',


  description: 'Read data from the linkfile in the current directory.',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    doesNotExist: {
      description: 'Linkfile does not exist.'
    },

    couldNotParse: {
      description: 'Linkfile is corrupted (cannot be parsed as JSON).'
    },

    success: {
      description: 'Done.',
      example: {
        id: 432,
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app',
        owner: 'mikermcneil'
      }
    },

  },


  fn: function(inputs, exits) {
    var path = require('path');
    var Filesystem = require('machinepack-fs');
    var dir = process.cwd();

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.readJson({
      source: path.resolve(dir, 'treeline.json'),
      schema: {
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app',
        owner: 'mikermcneil'
      }
    }).exec(exits);
  }


};
