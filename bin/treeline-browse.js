#!/usr/bin/env node


/**
 * Module dependencies
 */

var program = require('commander');
var chalk = require('chalk');
var browseToUrl = require('../standalone/browse-to-url');




program
.usage('')
.parse(process.argv);


// TODO: make this the actual url
var url = 'http://treeline.io/';

browseToUrl({
  url: url
}).exec({
  error: function(err) {
    console.error(chalk.red('Unexpected error occurred:\n'), err);
  },
  success: function(url) {
    console.log('Opening %s...',chalk.underline(url));
  }
});
