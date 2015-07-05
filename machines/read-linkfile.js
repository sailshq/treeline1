module.exports = {


  friendlyName: 'Read linkfile',


  description: 'Read data from the linkfile in the current directory.',


  inputs: {

    dir: {
      description: 'Path to the local project.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

  },


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
        id: '432',
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

    // Ensure we have an absolute destination path.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.readJson({
      source: path.join(inputs.dir, 'treeline.json'),
      schema: {
        id: '123',
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app',
        owner: 'mikermcneil'
      }
    }).exec(exits);
  }


};
