#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Browse on Treeline.io',


  description: 'Open the browser and navigate to the Treeline.io URL for the app/machinepack in the current directory.',


  exits: {

    success: {
      example: 'http://treeline.io/foo/bar'
    },

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
    }

  },


  fn: function (inputs, exits){

    var Urls = require('machinepack-urls');
    var thisPack = require('../');

    thisPack.readLinkfile().exec({
      error: exits.error,
      doesNotExist: exits.notLinked,
      success: function (project){

        var BASE_URL = 'http://treeline.io/';
        var url = Urls.sanitize({
          url: BASE_URL+'/'+project.owner+'/'+project.identity
        }).execSync();

        thisPack.browseToUrl({
          url: url
        }).exec({
          error: exits.error,
          success: function() {
            return exits.success(url);
          }
        });
      }
    });
  }


}, {

  success: function(url) {
    console.log('Opening %s...',require('chalk').underline(url));
  }

});
