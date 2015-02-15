module.exports = {


  friendlyName: 'List apps',


  description: 'List all Treeline apps owned by the user with the specified secret.',


  extendedDescription: '',


  inputs: {

    secret: {
      description: 'The Treeline secret key of the account whose apps will be listed.',
      example: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
    },

  },


  defaultExit: 'success',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    success: {
      description: 'Done.',
      example: [{
        identity: 'my-cool-app',
        displayName: 'My Cool App'
      }]
    }

  },


  fn: function (inputs, exits){

    var Http = require('machinepack-http');

    return exits.success();
  }


};
