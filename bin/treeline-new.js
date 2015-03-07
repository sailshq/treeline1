#!/usr/bin/env node

var chalk = require('chalk');
var yargs = require('yargs');
// Build CLI options
var cliOpts = (function (){
  var _cliOpts = yargs.argv;
  delete _cliOpts._;
  delete _cliOpts.$0;
  return _cliOpts;
})();
// Run the machine, which runs the generators
require('../').newApp({name: process.argv[2]}).exec({
  success: function (){
    console.log('New app generated.');
  },
  error: function(err) {
    console.log(chalk.red(err));
  }
});
