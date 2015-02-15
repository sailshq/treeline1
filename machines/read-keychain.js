module.exports = {


  friendlyName: 'Read keychain',


  description: 'Read data from the Treeline identity/config file.',


  inputs: {},


  defaultExit: 'success',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    success: {
      description: 'Done.',
      example: {
        id: '1949b41-ab193058133-919aec3513b-4921a',
        username: 'mikermcneil',
        secret: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
      }
    },

  },


  fn: function(inputs, exits) {

    var path = require('path');
    var Filesystem = require('machinepack-fs');
    var getHomeDirectoryPath = require('../standalone/get-home-directory');

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.readJson({
      source: path.resolve(getHomeDirectoryPath(), '.treeline.secret.json'),
      schema: {
        id: '1949b41-ab193058133-919aec3513b-4921a',
        username: 'mikermcneil',
        secret: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
      }
    }).exec(exits);

  }


};
