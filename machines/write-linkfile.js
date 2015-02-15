module.exports = {


  friendlyName: 'Write linkfile',


  description: 'Write or overwrite the linkfile in the current directory.',


  inputs: {

    identity: {
      description: 'The identity (i.e. slug) of the linked machinepack or app',
      example: 'my-cool-app',
      required: true
    },

    displayName: {
      description: 'The display name of the app to use as a label throughout the CLI',
      example: 'My Cool App',
      required: true
    },

    type: {
      description: 'The type of linked Treeline project this is (i.e. "app", "machinepack", etc.)',
      example: 'app',
      required: true
    }


  },


  defaultExit: 'success',


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
    var dir = process.cwd();

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.writeJson({
      destination: path.resolve(dir, '.treeline.json'),
      force: true,
      json: {
        identity: inputs.identity,
        displayName: 'My Cool App',
        type: 'app'
      }
    }).exec(exits);
  }


};
