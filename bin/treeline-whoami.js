#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Who am I?',


  description: 'Get known metadata about the Treeline account currently authenticated with this computer.',


  inputs: {},


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
