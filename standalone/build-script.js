/**
 * Module dependencies
 */

var program = require('commander');
var chalk = require('chalk');
var Machine = require('machine');



module.exports = function buildScript(machineDef, exitOverrides){

  var yargs = require('yargs');

  program
  .usage('[options]')
  .unknownOption = function NOOP(){};
  program.parse(process.argv);


  // Build CLI options
  var cliOpts = (function (){
    var _cliOpts = yargs.argv;
    delete _cliOpts._;
    delete _cliOpts.$0;
    return _cliOpts;
  })();


  Machine.build(machineDef).configure(cliOpts).exec(_.extend({

    error: function(err) {
      console.error(chalk.red('Unexpected error occurred:\n'), err);
    },

    success: function() {
      console.log(chalk.green('OK.'));
    }

  }, exitOverrides||{}));

};
