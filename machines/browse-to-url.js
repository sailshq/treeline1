module.exports = {


  friendlyName: 'Open URL in browser',


  description: 'Open the provided url in the browser.',


  inputs: {

    url: {
      description: 'The URL to open',
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

    var Urls = require('machinepack-urls');
    var openUrlInBrowser = require('open');

    inputs.url = Urls.resolve({url: inputs.url}).execSync();
    openUrlInBrowser(inputs.url);

    return exits.success();
  }


};
