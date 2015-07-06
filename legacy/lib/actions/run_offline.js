/**
 * Run the linked Sails app
 */

var Sails = require('sails/lib/app');
var _ = require('lodash');
var rc = require('rc');
var path = require('path');
var log = require('../../logger');
var fs = require('fs');
var chalk = require('chalk');

module.exports = function runApp (conf, args, cb) {

  if (conf.runningApp) return cb('Preview server is already running!');

  log();
  log(chalk.gray('Preparing to preview app in offline mode...'));

  log.hr();
  log('Treeline preview is warming up...'.yellow);
  log('(hit <CTRL+C> to cancel at any time)');
  log();

  var delayedLog = function (ms) {
    return function logFn () {
      var args = Array.prototype.slice.call(arguments);
      delayedLog.timers.push(setTimeout(function () {
        log.apply(log,args);
      }, ms || 300));
    };
  };

  delayedLog.timers = [];

  // Give up after 30 seconds
  delayedLog.timers.push(setTimeout(function () {
    log.error('The preview server isn\'t starting...');
    log.error('Please try again later.  If the problem persists, check @treelineHQ for updates.');
    for (var i in delayedLog.timers) {
      clearTimeout(delayedLog.timers[i]);
    }
    return;
  }, 30000));

  var localSails = path.resolve(process.cwd(), "node_modules", "sails", "lib", "app");
  var Sails = fs.existsSync(localSails) ? require(localSails) :  require('sails/lib/app');
  var sails = new Sails();

  var liftOptions = {
    models: {
      migrate: 'alter'
    },
    log: {
      level: 'error'
    }
  };

  // Load the app's local .sailsrc
  var localSailsRc = rc('sails', {}, ["--config", path.join(process.cwd(), '.sailsrc')]);

  // Delete keys that `rc` puts in that we don't want
  delete localSailsRc[0];
  delete localSailsRc[1];
  delete localSailsRc.config;

  // Merge our lift options
  _.extend(liftOptions, localSailsRc);

  // Make sure the Treeline plugin is listed
  liftOptions.plugins = liftOptions.plugins || {treeline: true};
  liftOptions.plugins.treeline = liftOptions.plugins.treeline || true;

  // Start sails and pass it command line arguments
  sails.lift(liftOptions, function (err) {

    if (err) return cb(err);

    // Clear obnoxious timers
    for (var i in delayedLog.timers) {
      clearTimeout(delayedLog.timers[i]);
    }

    // Keep track of running app
    conf.runningApp = sails;

    logTree();
    log();
    log('Your '+chalk.green('Treeline')+' app is now running in '+chalk.cyan('offline preview mode')+'.');
    log(('To see your app, visit ' + (sails.getBaseurl() || '').underline));
    log(chalk.gray('(hit <CTRL+C> to quit)'));

    // log.verbose("App listening!");
  });

};


function logTree() {
  var asciiArt = require('../../').buildAsciiArt().execSync();
  console.log(asciiArt);
}
