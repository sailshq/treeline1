module.exports = require('machine').build({
  identity: 'browse-to-url',
  description: 'Open the provided url in the browser.',
  inputs: {
    url: {
      example: 'http://node-machine.org/machinepack-facebook',
      required: true
    }
  },
  defaultExit: 'success',
  exits: {
    error: {},
    success: {},
  },
  fn: function (inputs, exits){

    var openUrlInBrowser = require('open');

    openUrlInBrowser(inputs.url);
    return exits.success();
  }
});
