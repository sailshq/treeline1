module.exports = {


  friendlyName: 'Read linkfile',


  description: 'Read data from the linkfile in the current directory.',


  inputs: {},


  defaultExit: 'success',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    success: {
      description: 'Done.',
      example: {
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app'
      }
    },

  },


  fn: function(inputs, exits) {
    return exits.success();
  }


};
