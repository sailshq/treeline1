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
// .command('browse', 'view on treeline.io')
.command('status', 'show logged-in account and linked app')
.command('preview', 'run app locally (like sails lift)')
.command('deploy', 'deploy app to hosting environment')
.command('login', 'log in to Treeline on this computer')
.command('logout', 'log out of Treeline on this computer')
.command('whoami', 'show the username of the logged-in Treeline account')
.command('new', 'create a new Sails app locally')
.command('link', 'link the current directory to a Treeline app or machinepack')
.command('unlink', 'remove the Treeline linkfile from the current directory')
.command('export', 'export a machinepack (e.g. to run as a script)')
.command('install', 'compile+export+install dependencies from treeline.io')
.command('browse', 'browse to this pack or app on treeline.io')
.command('about', 'about this module');



// If this is a `tl` shorthand command (e.g. `tl about`), then convert it
// to the full, spelled-out `treeline` equivalent before parsing the CLI args.
var prg = process.argv[1];
if (prg.match(/tl$/)) {
  process.argv.splice(1,1, prg.replace(/tl$/, 'treeline'));
}

// Parse the CLI args / opts.
program.parse(process.argv);


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


// $ treeline <alias>
//
// (i.e. check aliases, since wasn't matched by any overtly exposed commands)
if ( _.isString(program.args[0]) && (
  program.args[0] === 'start' ||
  program.args[0] === 'lift' ||
  program.args[0] === 'p' ||
  program.args[0] === 'develop' ||
  program.args[0] === 'dev' ||
  program.args[0] === 'd'
)) {
  return _alias('preview');
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
