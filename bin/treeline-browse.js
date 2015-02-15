#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Browse on Treeline.io',


  description: 'Open the browser and navigate to the Treeline.io URL for the app/machinepack in the current directory.',


  exits: {
    success: {
      description: 'Done.',
      example: 'http://treeline.io/foo/bar'
    },

  },


  fn: function (inputs, exits){

    var util = require('util');
    var browseToUrl = require('../').browseToUrl;

    // TODO: make this the actual url
    var url = 'http://treeline.io/';

    browseToUrl({
      url: url
    }).exec({
      error: exits.error,
      success: function() {
        return exits.success(url);
      }
    });


  }


}, {
  success: function(url) {
    console.log('Opening %s...',require('chalk').underline(url));
  }
});
