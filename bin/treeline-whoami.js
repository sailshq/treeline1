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


(Machine.build({

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


}))
.configure({

})
.exec({
  error: function(err) {
    console.error(chalk.red('Unexpected error occurred:\n'), err);
  },
  success: function() {
    console.log('OK.');
  }
});
