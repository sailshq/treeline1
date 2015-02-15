module.exports = {


  friendlyName: 'Write keychain',


  description: 'Write or overwrite the Treeline keychain/identity/config file.',


  inputs: {

    data: {
      description: 'The data to write to the keychain file.',
      typeclass: 'dictionary',
      // e.g. {
      //   id: '1949b41-ab193058133-919aec3513b-4921a',
      //   username: 'mikermcneil',
      //   secret: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
      // }
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
    return exits.success();
  }


};
