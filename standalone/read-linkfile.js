module.exports = require('machine').build({


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
        id: '38ab32813-a81385b',
        type: 'app',
        slug: 'my-cool-app',
        displayName: 'My Cool App'
      }
    },

  },


  fn: function(inputs, exits) {
    return exits.success();
  }


});
