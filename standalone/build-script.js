/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var program = require('commander');
var chalk = require('chalk');
var Machine = require('machine');
var yargs = require('yargs');


module.exports = function buildScript(opts, exitOverrides){

  // Use either `opts` or `opts.machine` as the machine definition
  var machineDef;
  if (!opts.machine) {
    machineDef = opts;
    opts = { machine: machineDef };
  }
  else {
    machineDef = opts.machine;
  }

  // Build machine, applying defaults
  var wetMachine = Machine.build(_.extend({
    identity: machineDef.identity||machineDef.friendlyName||'anonymous-machine-script',
    defaultExit: 'success',
    inputs: {},
    exits: {
      success: {
        description: 'Done.'
      },
      error: {
        description: 'Unexpected error occurred.'
      }
    },
    fn: function (inputs, exits){
      exits.error(new Error('Not implemented yet!'));
    }
  },machineDef||{}));


  // Configure CLI usage helptext and set up commander
  program.usage('[options]');

  // Keep track of shortcuts used (e.g. can't have a "-p" option mean two different things at once)
  var shortcutsSoFar = [];

  _.each(wetMachine.inputs, function (inputDef, inputName) {

    var opt = '--'+inputName;
    var optShortcut = (function (){
      var _shortcut = '-'+inputName[0];
      // If shortcut flag already exists using the same letter, don't provide a shortcut for this option.
      if (_.contains(shortcutsSoFar, _shortcut)) return;
      // Otherwise, keep track of the shortcut so we don't inadvertently use it again.
      shortcutsSoFar.push(_shortcut);
      return _shortcut;
    })();
    var optDescription = (function determineOptDescription(){
      var _optDescription = inputDef.description || inputDef.friendlyName || '';
      return (_optDescription[0]||'').toLowerCase() + _optDescription.slice(1);
    })();


    // Call out to commander and apply usage
    var optUsage = (function (){
      if (optShortcut){
        return util.format('%s, %s', optShortcut, opt);
      }
      return util.format('%s', opt);
    })();
    if (optDescription) {
      program.option(optUsage, optDescription);
    }
    else {
      program.option(optUsage);
    }

  });
  program.parse(process.argv);


  // Notice we DON'T tolerate unknown options
  // If we wnated to, we'd have to have something like the following:
  // .unknownOption = function NOOP(){};


  // Build inputs from CLI options and args
  var inputConfiguration = {};

  // Supply CLI options
  _.extend(inputConfiguration, yargs.argv);
  delete inputConfiguration._;
  delete inputConfiguration.$0;

  // Include a special `args` input for convenience--
  // but note that this is an experimental feature that could change.
  if (_.isArray(yargs.argv._)) {
    inputConfiguration.args = yargs.argv._;
  }

  // Supply argv CLI arguments using special `args` notation
  if (_.isArray(opts.args)) {
    _.each(opts.args, function (inputName, i){
      inputConfiguration[inputName] = yargs.argv._[i];
    });
  }


  // Run the machine
  wetMachine(inputConfiguration).exec(_.extend({

    error: function(err) {
      // console.error(chalk.red('Unexpected error occurred:\n'), err);
      if (err.message) {
        console.error(chalk.red(err.message));
      }
      if (err.stack) {
        console.error(chalk.gray(err.stack));
        return;
      }
      console.error(chalk.red(err));
      return;
    },

    success: function() {
      console.log(chalk.green('OK.'));
    }

  }, exitOverrides||{}));


};
