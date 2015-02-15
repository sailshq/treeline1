#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Link',


  description: 'Link the current directory to an app or machinepack in Treeline.',


  inputs: {

    identity: {
      description: 'The identity (i.e. slug) of the machinepack or app to link',
      example: 'my-cool-app'
    }

  },


  fn: function (inputs, exits){

    var util = require('util');


    return exits.success();
  }


});
