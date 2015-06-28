module.exports = {


  friendlyName: 'Link app/pack (if necessary)',


  description: 'Link the current directory to an app or machinepack in Treeline.',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project this is (app or machinepack)',
      example: 'machinepack',
      defaultsTo: 'app'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    }
  },


  exits: {

    noApps: {
      description: 'No apps belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    noMachinepacks: {
      description: 'That user account doesn\'t have any accessible machinepacks.',
      example: {
        username: 'mikermcneil'
      }
    },

    forbidden: {
      description: 'Username/password combo invalid or not applicable for the selected app/machinepack.'
    },

    success: {
      example: {
        identity: '123',
        displayName: 'My Cool Machinepack',
        type: 'machinepack',
        owner: 'mikermcneil',
        id: '123'
      }
    }
  },


  fn: function (inputs, exits) {
    var thisPack = require('../');

    thisPack.readLinkfile().exec({
      error: exits.error,
      doesNotExist: function (){
        thisPack.link({
          type: inputs.type,
          treelineApiUrl: inputs.treelineApiUrl,
        }).exec({
          error: exits.error,
          noApps: exits.noApps,
          noMachinepacks: exits.noMachinepacks,
          success: function (linkedProject){
            return exits.success(linkedProject);
          }
        });
      },
      success: function (linkedProject) {
        return exits.success(linkedProject);
      }
    });
  }

};

