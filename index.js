#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander'),
  prompt = require('prompt'),
  async = require('async'),
  Sails = require('sails/lib/app'),
  util = require('sails/node_modules/sails-util'),
  path = require('path'),
  fs = require('fs'),
  fse = require('fs-extra'),
  _ = require('lodash'),
  buildDictionary = require('sails-build-dictionary'),
  rc = require('rc'),
  argv = require('optimist').argv;

// Actions
var actions = require('./lib/actions');

// Treeline api wrapper
var api = require('./api');

// Monkey-patch `commander` with menu functionality.
require('./menu')(program);
// Monkey-patch `commander` with "create new app" functionality.
require('./newApp')(program);

// Strings
var __ = require('./strings');

// Configure logger
//
var log = require('./logger');


// Set up defaults for the CLI config
//
var PATH_TO_USERCONFIG = './.cliconfig.json';
var CLI_CONFIG_DEFAULTS = {

  // Path to Treeline's secret JSON file
  pathToCredentials: path.resolve(util.homeDirectory() + '/.treeline.secret.json'),

  // URL where treeline is hosted
  treelineURL: 'http://api.treeline.io'
};

// Customize the prompt.
//
prompt.message = '>'.yellow;
prompt.delimiter = '';


// The `conf` global is shared throughout the CLI utility
// This was used instead of async.auto's `data` argument to avoid repetetive code.
var conf = {};


// $ treeline -v
// Make version option case-insensitive
if (argv.v || argv.V) {
  process.argv.push('-V');
}





// Start commander
program
  .version('0.0.1');


// $ treeline logout
program
  .command('logout')
  .description('wipe cached Treeline secret')
  .action(function () {
    async.auto({
      config: readConfig,
      _logout: ['config', logout]
    }, function (err) {

      // If an error occurred, the file probably doesn't exist
      // TODO: do smarter error negotiation here
      if (err) {
        log();
        log('This computer is not currently logged in to Treeline.'.grey);
        return _done();
        // log.error('Logout failed!');
        // log(('Treeline credentials file could not be found in the configured directory (' + pathToCredentials + ')').grey);
        // return cb(err);
      }

      log();
      _logHR();
      log('This computer has been logged out of Treeline.');
      log(('Treeline credentials were erased from `' + path.resolve(conf.config.pathToCredentials) + '`').grey);
      _done();
    });
  });



// $ treeline login
program
  .command('login')
  .description('login to Treeline and cache secret')
  .action(function () {
    async.auto({
      config: readConfig,

      // Look up the secret on the user's system
      credentials: ['config', function (cb) {
        readSecret(function (err) {
          if (err) return cb(err);
          if (conf.credentials) {
            log();
            log(('You are already logged in as '+((conf.credentials.username).cyan)+'.').grey);
          }
          cb();
        });
      }],

      // Log in
      login: ['credentials', doLogin]

    }, _done);
  });



// $ treeline link
program
  .command('link')
  .description('link current dir to one of your projects')
  .action(function () {

    // Determine expected location of treeline.json file
    var jsonPath = process.cwd() + '/treeline.json';
    jsonPath = path.resolve(jsonPath);

    // Check that treeline.json doesn't already exist
    if (fs.existsSync(jsonPath)) {

      // TODO: remove the `exists` check-- leads to transactional race conditions.
      return fse.readJSON(jsonPath, function (err, linkedProject){
        // log.error('Failed to create link in current directory.');
        if (err) {
          log.error('Hmm... This directory\'s linkfile appears to be corrupted...');
          log.error('Please run `treeline unlink` to remove it, then try linking again.'.grey);
          return _done(err);
        }
        // log('A linkfile already exists in this directory...'.grey);
        log();
        log(('This directory is currently linked to project ' + (''+linkedProject.id).cyan) + ' on Treeline.');
        log('If you want to link it to a different backend, please run `treeline unlink` first.'.grey);
        log('NOTE: Unlinking a directory does not affect its views or assets directories.'.grey);
        return _done();
      });
    }


    // TODO: Create views directory
    // TODO: Create assets directory
    // TODO: If either exists, warn user that the front-end stuff in there may not match up with the app they're linking.

    // Create treeline.json file
    writeLinkfile(function (err) {
      if (err) return log.error(err);

      log();
      _logHR();
      log('Directory is now linked to ' + ('"'+conf.targetProject.fullName+'"').cyan);
      log('Run `treeline preview` to run the preview server.');
      log(('Created linkfile at: '+jsonPath).grey);
      // log('Would you like to link it with a different project?');
      // log('Any files in this directory, e.g. views and assets, will be left alone.'.grey);

      _done();

    }, {});

  });


// $ treeline unlink
program
  .command('unlink')
  .description('wipe Treeline link from the current dir')
  .action(function () {

    // Lookup location of treeline.json file
    var jsonPath = process.cwd() + '/treeline.json';
    jsonPath = path.resolve(jsonPath);

    fs.unlink(jsonPath, function (err) {
      if (err) {
        log();
        log('This directory is not linked to a Treeline app.'.grey);
        return _done();
      }
      log();
      _logHR();
      log('Link removed.');
      log(('This directory is no longer linked to a Treeline project.').grey);
      log(('Removed linkfile: '+jsonPath).grey);

      _done();
    });
  });



// $ treeline preview
program
  .command('preview')
  .option('--force-sync')
  .option('--export')
  .option('--models-only')
  .description('preview the app in the current dir')
  .action(function () {

    async.auto({

      // Get CLI config
      config: readConfig,

      // Get login credentials
      credentials: ['config', authenticate],

      // Figure out which project to lift
      target: ['credentials', acquireLink],

      // Lift app
      _runApp: ['target', function(cb, results) {
        actions.run(conf, program.args, cb);
      }]

    }, _done);

  });


// $ treeline configure
program
  .command('configure')
  .description('interactive settings for this command-line tool')
  .action(function () {
    log('Configuring the command-line tool...');
    log('[CTRL+C] to cancel'.grey);

    program
    .chooseFromMenu (
    'Options',
    [
      'Set location for cached Treeline credentials',
      'Configure treeline endpoint'
    ],
    {
      '*': function ( choice, index ){
        log();
        _logHR();
        log.error('Not implemented yet!');
        return;
      }
    });
  });


// $ treeline compile
program
  .command('compile')
  .description('compile project into a deployable Node.js server')
  .action(function () {
    log();
    _logHR();
    log.error('Not implemented yet!');
    return;
  });



// $ treeline status
program
  .command('status')
  .description('info about the Treeline project in the current directory')
  .action(function () {
    async.auto({
      config: readConfig,
      credentials: ['config', readSecret],
      target: ['credentials', readLink],
      logStatus: ['target', function (cb) {

        log();
        log('=='.yellow+' Treeline Status '+'=='.yellow);

        // Account information
        if (!conf.credentials) {
          log('This computer is not currently logged in to Treeline.'.grey);
        }
        else {
          log('This computer is logged-in to Treeline as '+((conf.credentials.username).cyan)+ '.');
        }
        // log();

        // Project information
        if (!conf.targetProject) {
          log(('This directory (' + process.cwd() + ') is not linked to a Treeline app.').grey);
        }
        else {
          log('This directory is linked to '+((''+conf.targetProject.fullName).cyan) + '.');
        }

        // Done.
        cb();

      }]
    }, _done);
  });



// $ treeline *
program
  .command('*')
  .action(program.help);



program
  .parse(process.argv);


// If no arguments were provided, i.e. `treeline`
// treat it just like `treeline --help`
if ( ! argv._.length ) {
  program.help();
}


















// Actions
//
// TODO: refactor into submodules



/**
 * Look up the configuration for this CLI tool
 */
function readConfig (cb) {
  var cliConfigPath = path.resolve(__dirname, PATH_TO_USERCONFIG);
  fse.readJSON(cliConfigPath, function (err, config) {
    // If an error occured, the config file probably doesn't exist.
    // So try creating it
    if (err) {

      // Write to disk
      log.verbose('Saving CLI config to ' + cliConfigPath + '...');
      fse.outputJSON(cliConfigPath, CLI_CONFIG_DEFAULTS, function (err) {
        if (err) {
          log.error('Could not stringify and/or save `.cliconfig.json` config file for this command-line tool in the directory where Treeline is installed.');
          return cb(err);
        }
        return cb();
      });
      return;
    }

    var jsonPath = process.cwd() + '/treeline.json';
    jsonPath = path.resolve(jsonPath);

    // Sort of a cheap hack to attempt to read a treeline URL from the project's treeline.json file
    // if it exists, so that we can use different Treeline instances for different projects.
    fse.readJSON(jsonPath, function (err, json){

      config.treelineURL = (!err && json.treelineURL) ? json.treelineURL : config.treelineURL;
      config.pathToCredentials = (!err && json.pathToCredentials) ? json.pathToCredentials : config.pathToCredentials;

      // Ensure configured treelineURL has no trailing slash.
      config.treelineURL = util.str.rtrim(config.treelineURL, '/');

      // CLI config loaded successfully- save it to `conf`
      log.verbose('Loaded config :: ', config);
      conf.config = config;

      return cb();

    });

  });
}





/**
 * Attempt to read the user's treeline secret
 * from their local treeline secret file.
 */
function readSecret (cb) {
  if (conf.credentials) return cb();

  var pathToCredentials = conf.config.pathToCredentials;
  pathToCredentials = path.resolve(conf.config.pathToCredentials);

  fse.readJSON(pathToCredentials, function (err, credentials) {

    // If an error occured, the secret file probably doesn't exist
    // at the configured location. So prompt user to log in
    // and then create a new one.
    if (err) return cb();

    // Credentials loaded successfully- pass 'em on.
    conf.credentials = credentials;

    // Also clear out projects so they'll be re-fetched
    conf.projects = null;

    return cb();

  });
}




/**
 * Fetch a list of the user's previewable treeline apps
 */
function fetchApps (cb) {
  if (conf.projects) return cb();

  api.getApps({
    baseURL: conf.config.treelineURL,
    secret: conf.credentials.secret
  }, function (err, response) {
    if (err) {

      // If there is an authentication problem,
      // wipe credentials and attempt to login again
      if (err.status == 403) {
        log('Sorry, looks like your account secret has changed, or the local file has become corrupt.');
        log('Please run `treeline logout`, then try again.'.grey);
        conf.credentials = null;
        return cb('Access denied.');
      }

      // Otherwise, if the error is fatal, pass it on.
      return cb(err);
    }

    conf.projects = response;

    cb();
  });
}



function doLogin (cb) {
  if ( conf.credentials ) return cb();

  // Start the prompt
  // Get two properties from the user: username and password
  //
  log();
  log('Login to Treeline:'.green);
  prompt.message = '';
  prompt.delimiter = '';
  prompt.start();
  prompt.get({
    properties: {
      username: {
        type: 'string',
        required: true
      },
      password: {
        type: 'string',
        message: '(don\'t worry, I caught all that-- just hiding those keystrokes)',
        hidden: true,
        required: true
      }
    }
  },
  function userEnteredMessage (err, userInput) {
    if (err) {
      // Fail silently on cancel (user presses CTRL+C)
      if (err.message === 'canceled') {
        log('\n');
        return;
      }
      return cb(err);
    }

    api.login({
      baseURL: conf.config.treelineURL,
      params: {
        username: userInput.username,
        password: userInput.password
      }
    }, function (err, response) {

      // Login failed - could be various reasons
      if (err) {
        if (err.status === 400 && err.errors) {
          log.error('Login failed.');
          log('Sorry, I don\'t recognize that username/password combination.');
          log('Please try again, or hit <CTRL+C> to cancel.'.grey);
          return doLogin(cb);
        }
        return cb(err);
      }

      if (!response || !response.secret) {
        return cb('Unexpected response from Treeline (no secret):' + util.inspect(response));
      }


      var credentials = {
        secret: response.secret,
        username: response.username || '???',
        accountId: response.id
      };

      // If login was successful stringify and write the credentials file to disk
      fse.outputJSON( path.resolve(conf.config.pathToCredentials),
        credentials, function (err) {
        if (err) {
          log.error('Login failed.');
          log('Could not stringify and/or save Treeline credentials file in the configured directory ('+pathToCredentials+')');
          log('That directory may not exist, or there could be a permissions issue.'.grey);
          return cb(util.inspect(err));
        }

        log();
        _logHR();
        log('This computer is now logged in to Treeline as '+((credentials.username).cyan));
        log(('Treeline credentials were saved in `'+conf.config.pathToCredentials+'`').grey);
        log('You can change the location of this file by running `treeline configure`'.grey);
        conf.credentials = credentials;

        // Clear out projects so they'll be re-fetched
        conf.projects = null;

        return cb();
      });
    });
  });
}



function doChooseApp (cb) {
  if (conf.targetProject) return cb();

  fetchApps(function (err) {
    if (err) return cb(err);

    // No apps exist, output an error message
    if (!conf.projects || !conf.projects.length) {
      return cb(__.NO_APPS_AVAILABLE);
    }

    // If there's an app that matches the local app's name exactly, pull it out to put at the top of the list
    var localApp = require(process.cwd()+'/package.json');
    var matchingApp = util.remove(conf.projects, function(project) {return project.name == localApp.name;});
    conf.projects = matchingApp.concat(conf.projects);

    // Map apps for use in the menu
    var apps = util.map(conf.projects, function (app) {
      return ((''+app.fullName).yellow) + '   ' + ('/' + conf.credentials.username + '/' + (app.name||'')).grey;
    });

    apps.push(('** Create a new project **').green);

    program
    .chooseFromMenu (
    __.CHOOSE_APP_TO_LIFT,
    apps,
    {
      '*': function ( choice, index ){
        if (index < apps.length - 1) {
          conf.targetProject = conf.projects[index];
          cb();
        } else {
          var createApp = function(appName, cb) {
            api.createNewApp({
              baseURL: conf.config.treelineURL,
              secret: conf.credentials.secret,
              params: {name: appName, fullName: appName, account: conf.credentials.accountId}
            }, cb);
          };
          program.createNewApp(localApp.name, createApp, function(err, newApp) {
            if (err) {
              log((err).red);
              return doChooseApp(cb);
            }
            conf.targetProject = newApp;
            cb();
          });
        }
      }
    });
  });

}







function logout (cb) {
  log.verbose('Erasing Treeline credentials...');

  // Lookup location of json credentials file
  var pathToCredentials = conf.config.pathToCredentials;
  pathToCredentials = path.resolve(conf.config.pathToCredentials);

  fs.unlink(pathToCredentials, cb);
}







// Compound methods
////////////////////////////



/**
 * authenticate
 *
 * Shortcut for readConfig and [credentials or login]
 */
function authenticate (cb) {
  if (conf.credentials) return cb();

  // If secret is invalid, delete it and send user to the authentication flow
  // If secret is missing, send user to the authentication flow
  // If secret is valid, good to go
  async.auto({

    // Load config
    config: readConfig,

    // Look up the secret on the user's system
    credentials: ['config', readSecret],

    // Log in
    login: ['credentials', doLogin]

  }, cb);
}





function writeLinkfile (cb) {
  async.auto({

    // Load config
    config: readConfig,

    // Use cached credentials or enter login flow
    credentials: authenticate,

    // Fetch apps available to this user from treeline server
    // or prompt user for login credentials if necessary.
    apps: ['credentials', fetchApps],

    // Ask user to pick an app
    target: ['apps', doChooseApp],

  }, function (err) {
    if (err) return cb(err);


    // Determine expected location of treeline.json file
    var jsonPath = process.cwd() + '/treeline.json';
    jsonPath = path.resolve(jsonPath);

    // Then write the linkfile to disk
    fse.outputJSON(jsonPath, conf.targetProject, cb);
  });
}




function acquireLink (cb) {
  if (conf.targetProject) return cb();

  async.auto({

    // Load config
    config: readConfig,

    // Use cached credentials or enter login flow
    credentials: authenticate,

    readLinkfile: ['credentials', readLink],

    // Fetch apps available to this user from treeline server
    // or prompt user for login credentials if necessary.
    // Ask user to pick an app
    target: ['readLinkfile', doChooseApp],

    writeLinkfile: ['target', writeLinkfile]

  }, cb);
}



function readLink (cb) {

  if (conf.targetProject) return cb();

  // Determine expected location of treeline.json file
  var jsonPath = process.cwd() + '/treeline.json';
  jsonPath = path.resolve(jsonPath);

  async.auto({

    readFile: function (cb) {
      fse.readJSON(jsonPath, function (err, json){
        if (err) {

          // If the file simply doesn't exist, we won't call this an error
          // instead, exit silently
          if (err instanceof Error && err.errno===34) {
            return cb();
          }

          // If some other sort of error occurred, we'll assume the file is corrupted.
          log.error('Linkfile in current directory is corrupted.');
          log.error('Please run `treeline unlink` here, then try again.'.grey);
          return cb(err);
        }

        // Save reference to target
        conf.targetProject = json;
        cb();
      });
    },

    // Fetch apps so we can (1) ensure account is valid,
    apps: ['readFile', fetchApps],

    // and (2) ensure the target (linked) project is accessibile to that logged-in user.
    // Not a security issue, but important for good UX
    // (running `treeline status` should always result in accurate information, for instance)
    validate: ['apps', function (cb) {

      // If no target project is currently defined, skip this check
      if ( !conf.targetProject ) return cb();

      // Ensure account has access to the target app
      if ( !util.contains( util.pluck(conf.projects, 'id'), conf.targetProject.id ) ) {
        log('Sorry, you do not have permission to preview the linked project: '+conf.targetProject.fullName+'  (' + conf.targetProject.id +')');
        log('Please run `treeline unlink` here, then try again to set up a new link.'.grey);
        conf.targetProject = null;
        return cb('Access denied.');
      }
      cb();
    }]

  }, cb);
}



// stub function to use as a final callback
// Log an error if there is one, otherwise throw in a newline
function _done (err) {
  if (err) return log.error(err);
  log();
}



function _logHR() {
  log();
  log('--'.grey);
}


