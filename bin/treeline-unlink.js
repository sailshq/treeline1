#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Unlink',


  description: 'Unlink the current directory from Treeline.',


  fn: function (inputs, exits){

    var util = require('util');


    return exits.success();
  }


});

