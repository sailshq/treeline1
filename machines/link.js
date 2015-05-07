module.exports = {

  friendlyName: 'Link',


  description: 'Link the current directory to an app or machinepack in Treeline.',


  inputs: {

    $0: {
      friendlyName: 'Type',
      description: 'First CLI argument is the type of Treeline project to link (app or machinepack)',
      example: 'machinepack',
      defaultsTo: 'app'
    },

    identity: {
      description: 'The identity (i.e. slug) of the machinepack or app to link',
      example: 'my-cool-app'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io'
    }

  },

  exits: {

    noApps: {
      description: 'No apps belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    unknownType: {
      description: 'Unknown project type.  You can link an "app" or a "machinepack".'
    },

    forbidden: {
      description: 'Username/password combo invalid or not applicable for the selected app.'
    },

    success: {
      example: {
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app',
        owner: 'mikermcneil',
        id: 123
      }
    }

  },


  fn: function (inputs, exits){

    var Machine = require('machine');

    // Link either an app or a machinepack
    switch (inputs.$0) {
      case 'machinepack':
      case 'pack':
      case 'p':
        console.log('TODO: support for linking packs');
        // return Machine.build(require('./link-machinepack'))(inputs).exec(exits);
        return exits.success();

      case 'a':
      case 'ap':
      case 'app':
        return Machine.build(require('./link-app'))(inputs).exec(exits);

      default:
        return exits.unknownType();
    }

  }

};
