module.exports = {


  friendlyName: 'Authenticate',


  description: 'Look up the Treeline secret for the specified username/password combination.',


  extendedDescription: '',


  inputs: {

    username: {
      description: 'A Treeline username or email address',
      required: true
    },

    password: {
      description: 'The password for the Treeline account with this username',
      required: true
    }

  },


  defaultExit: 'success',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    success: {
      description: 'Treeline secret key fetched successfully.',
      example: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
    },

  },


  fn: function (inputs, exits){

    var Http = require('machinepack-http');

    return exits.success();
  }

};
