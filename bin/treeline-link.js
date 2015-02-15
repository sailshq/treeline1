#!/usr/bin/env node

/**
 * Module dependencies
 */

var util = require('util');
var program = require('commander');
var chalk = require('chalk');
var Machine = require('machine');

program
  .usage('[options]')
  .unknownOption = function NOOP(){};
program.parse(process.argv);


// Build CLI options
var cliOpts = (function (){
  var _cliOpts = require('yargs').argv;
  delete _cliOpts._;
  delete _cliOpts.$0;
  return _cliOpts;
})();



Machine.build({

  friendlyName: 'Link',


  description: 'Link the current directory to an app or machinepack in Treeline.',


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


})
.configure(cliOpts)
.exec({
  error: function(err) {
    console.error(chalk.red('Unexpected error occurred:\n'), err);
  },
  success: function() {
    console.log('OK.');
  }
});


