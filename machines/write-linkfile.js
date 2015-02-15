module.exports = {


  friendlyName: 'Write linkfile',


  description: 'Write or overwrite the linkfile in the current directory.',


  inputs: {

    identity: {
      description: 'The identity (i.e. slug) of the linked machinepack or app',
      example: 'my-cool-app'
    },

    displayName: {
      example: 'My Cool App'
    },

    type: {
      description: 'The type of linked Treeline project this is (i.e. "app", "machinepack", etc.)',
      example: 'app'
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
