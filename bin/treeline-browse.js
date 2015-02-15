#!/usr/bin/env node


/**
 * Module dependencies
 */

var program = require('commander');
var chalk = require('chalk');
var browseToMachinepackUrl = require('../standalone/browse-to-machinepack-url');




program
  .usage('[toWhat]')
  // .command('docs', 'browse usage docs, like a manpage')
  // .command('npm', 'browse pack on npmjs.org')
  // .command('source', 'browse the changelog / repo')
  // .command('tests', 'browse status of automated tests, e.g. on Travis CI')
  .parse(process.argv);



browseToMachinepackUrl({
  dir: process.cwd(),

  // If optional command-line argument was provided, use it as the `toWhat`
  toWhat: program.args[0] || ''

}).exec({
  error: function(err) {
    console.error(chalk.red('Unexpected error occurred:\n'), err);
  },
  notMachinepack: function() {
    console.error('This is ' + chalk.red('not a machinepack') + '.');
    console.error('Be sure and check that the package.json file has a valid `machinepack` property, or run `machinepack init` if you aren\'t sure.');
  },
  success: function(url) {
    console.log('Opening %s...',chalk.underline(url));
  }
});
