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
    return exits.success();
  }


};
