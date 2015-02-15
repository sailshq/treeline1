module.exports = {


  friendlyName: 'Write keychain',


  description: 'Write or overwrite the Treeline keychain/identity/config file.',


  inputs: {

    username: {
      description: 'The username to write to the keychain file.',
      example: 'mikermcneil',
      required: true
    },

    secret: {
      description: 'The secret to write to the keychain file',
      example: '29f559ae-3bec-4d0a-8458-1f4e32a72407',
      required: true
    }

  },


  fn: function(inputs, exits) {
    var path = require('path');
    var Filesystem = require('machinepack-fs');
    var getHomeDirectoryPath = require('../standalone/get-home-directory');

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.writeJson({
      destination: path.resolve(getHomeDirectoryPath(), '.treeline.secret.json'),
      force: true,
      json: {
        username: inputs.username,
        secret: inputs.secret
      }
    }).exec(exits);
  }


};
