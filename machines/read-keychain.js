module.exports = {


  friendlyName: 'Read keychain',


  description: 'Read data from the Treeline identity/config file.',


  exits: {

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
    var Filesystem = require('machinepack-fs');
    var getHomeDirectoryPath = require('../standalone/get-home-directory');

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.readJson({
      source: path.resolve(getHomeDirectoryPath(), '.treeline.secret.json'),
      schema: {
        username: 'mikermcneil',
        secret: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
      }
    }).exec(exits);

  }


};
