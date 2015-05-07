module.exports = {


  friendlyName: 'Start developing',


  description: 'Start a local/development preview session with an app or machinepack.',


  inputs: {

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
    },

    noApps: {
      description: 'No apps belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    forbidden: {
      description: 'Unrecognized username/password combination.',
      extendedDescription: 'Please try again or visit http://treeline.io to reset your password or locate your username.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      variableName: 'result',
      description: 'Done.',
    },

  },


  fn: function (inputs,exits) {

    var Machine = require('machine');
    var previewApp = Machine.build(require('./preview-app'));

    return previewApp().exec(exits);
  },



};
