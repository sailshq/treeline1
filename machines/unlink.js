module.exports = {


  friendlyName: 'Unlink',


  description: 'Unlink the specified directory from Treeline.',


  extendedDescription: '',


  inputs: {

    dir: {
      description: 'Path to the local project.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
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

    // Ensure we have an absolute destination path.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.rmrf({
      dir: path.resolve(inputs.dir, 'treeline.json')
    }).exec({
      error: function (err){
        return exits.error(err);
      },
      success: function (){
        return exits.success();
      }
    });
  }


};
