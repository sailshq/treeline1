#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Log out',


  description: '',


  exits: {

    notLoggedIn: {
      description: 'This computer is not authenticated with a Treeline account.'
    }
  },


  fn: function (inputs, exits){

    var util = require('util');


    return exits.success();
  }


});
