module.exports = {


  friendlyName: 'Write linkfile',


  description: 'Write or overwrite the linkfile in the current directory.',


  inputs: {

    data: {
      description: 'The data to write to the linkfile',
      typeclass: 'dictionary',
      // e.g. {
      //   id: '38ab32813-a81385b',
      //   type: 'app',
      //   slug: 'my-cool-app',
      //   displayName: 'My Cool App'
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
