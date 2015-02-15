#!/usr/bin/env node


/**
 * Module dependencies
 */

var program = require('commander');
var chalk = require('chalk');
var Machine = require('machine');


program
  .usage('[options]')
  .unknownOption = function NOOP(){};
program.parse(process.argv);



(Machine.build({

  friendlyName: 'Browse on Treeline.io',


  description: '',


  inputs: {

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    success: {
      description: 'Done.',
      example: 'http://treeline.io/foo/bar'
    },

  },


  fn: function (inputs, exits){

    var util = require('util');
    var browseToUrl = require('../standalone/browse-to-url');

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


}))
.configure({})
.exec({
  error: function(err) {
    console.error(chalk.red('Unexpected error occurred:\n'), err);
  },
  success: function(url) {
    console.log('Opening %s...',chalk.underline(url));
  }
});
