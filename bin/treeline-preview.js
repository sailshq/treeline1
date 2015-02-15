#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Preview app',


  description: '',


  inputs: {

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    success: {
      description: 'Done.'
    },

  },


  fn: function (inputs, exits){

    var util = require('util');


    return exits.success();
  }


});
