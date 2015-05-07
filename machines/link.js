module.exports = {

  friendlyName: 'Link',


  description: 'Link the current directory to an app or machinepack in Treeline.',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project to link (app or machinepack)',
      example: 'machinepack',
      defaultsTo: 'app'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io'
    },

    // CURRENTLY FOR PACKS ONLY (todo: refactor)
    // ======================================
    id: {
      description: 'The id of the machinepack to link',
      example: 'f83193a9-199a3ba910-eaf1-081059b31',
      extendedDescription: 'If omitted, the command-line user will be prompted to make a choice.'
    },

    username: {
      description: 'The username of the account which owns the desired machinepack.',
      example: 'rachaelshaw',
      extendedDescription: 'If omitted, the command-line user will be the assumed owner.'
    },

    // FOR APPS ONLY (todo: refactor)
    // ======================================
    identity: {
      description: 'The identity (i.e. slug) of the app to link',
      example: 'my-cool-app'
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
    switch (inputs.type) {
      case 'machinepack':
      case 'pack':
      case 'p':
        return Machine.build(require('./link-pack'))(inputs).exec(exits);

      case 'a':
      case 'ap':
      case 'app':
        return Machine.build(require('./link-app'))(inputs).exec(exits);

      default:
        return exits.unknownType();
    }

  }

};
