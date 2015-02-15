module.exports = require('machine').build({


  friendlyName: 'Open URL in browser',


  description: 'Open the provided url in the browser.',


  inputs: {

    url: {
      example: 'http://node-machine.org/machinepack-facebook',
      required: true
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


  fn: function (inputs, exits){

    var openUrlInBrowser = require('open');

    openUrlInBrowser(inputs.url);
    return exits.success();
  }


});
