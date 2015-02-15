#!/usr/bin/env node

/**
 * Module dependencies
 */

var util = require('util');
var program = require('commander');
var chalk = require('chalk');
var _ = require('lodash');


var VERSION = require('../package.json').version;



program
.version(VERSION)
// Allow unknown options.
.unknownOption = function NOOP(){};
program.usage(chalk.gray('[options]')+' '+chalk.bold('<command>'))
.command('browse', 'view on node-machine.org')
.command('info', 'get pack metadata')
.command('ls', 'list machines')
.command('add', 'add a new machine')
.command('exec <identity>', 'run machine')
.command('rm <identity>', 'delete existing machine')
.command('mv <originalIdentity> <newIdentity>', 'rename machine')
.command('cp <originalIdentity> <newIdentity>', 'copy machine')
.command('init', 'make this module a machinepack')
.command('scrub', 'scrub pack; generate missing tests, etc.')
.command('about', 'about this module')
.parse(process.argv);


// When `treeline help` is called, `program.help()` is triggered automatically by commander.
// To trigger `help` manually:
// program.outputHelp();


// $ treeline
//
// (i.e. with no CLI arguments...)
if (program.args.length === 0) {
  return _alias('about');
}


// $ treeline <command>
//
// (i.e. matched one of the overtly exposed commands)
var matchedCommand = !!program.runningCommand;
if (matchedCommand){
  return;
}


// $ treeline <??>
//
// (i.e. check aliases, since wasn't matched by any overtly exposed commands)
if (program.args[0] === 'start' || program.args[0] === 'preview') {
  return _alias('lift');
}
// ...


// $ treeline <*>
//
// (i.e. final handler)
(function unknownCommand(){

  // Display usage (i.e. "help"):
  program.outputHelp();
})();












/**
 * Helper fn
 * @param  {String} aliasFor [string command to redirect to]
 */
function _alias (aliasFor){
  process.argv.splice(process.argv.indexOf(program.args[0]),1);
  require('./treeline-'+aliasFor);
}
