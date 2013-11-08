#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander'),
	prompt = require('prompt'),
	async = require('async'),
	Sails = require('sails/lib/app'),
	util = require('sails/util'),
	path = require('path'),
	fs = require('fs');

// Shipyard api wrapper
var api = require('./api');

// Monkey-patch `commander` with menu functionality.
require('./menu')(program);

// Strings
var __ = require('./strings');

// Configure logger
//
var log = require('./logger');


// Set up defaults for the CLI config
//
var PATH_TO_USERCONFIG = './.cliconfig.json';
var CLI_CONFIG_DEFAULTS = {

	// Path to Shipyard's secret JSON file
	pathToCredentials: path.resolve(util.homeDirectory() + '/.shipyard.secret.json'),

	// URL where shipyard is hosted
	shipyardURL: 'http://localhost:1337'
	// shipyardURL: 'http://creepygiggles.com'
};

// Customize the prompt.
//
prompt.message = '>'.yellow;
prompt.delimiter = '';

program
	.version('0.0.1');


// The `conf` global is shared throughout the CLI utility
// This was used instead of async.auto's `data` argument to avoid repetetive code.
var conf = {};



// $ yard logout
program
	.command('logout')
	.description('wipe cached Shipyard secret')
	.action(function () {
		async.auto({
			config: readConfig,
			_logout: ['config', logout]
		}, _done);
	});



// $ yard login
program
	.command('login')
	.description('login to Shipyard and cache secret')
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



// $ yard link
program
	.command('link')
	.description('link current dir to one of your projects')
	.action(function () {

		// Determine expected location of shipyard.json file
		var jsonPath = process.cwd() + '/shipyard.json';
		jsonPath = path.resolve(jsonPath);

		// Check that shipyard.json doesn't already exist
		if (fs.existsSync(jsonPath)) {
			return util.parseJSONFile(jsonPath, function (err, linkedProject){
				// log.error('Failed to create link in current directory.');
				if (err) {
					log.error('Hmm... This directory\'s linkfile appears to be corrupted...');
					log.error('Please run `yarr unlink` to remove it, then try linking again.'.grey);
					return _done(err);
				}
				// log('A linkfile already exists in this directory...'.grey);
				log();
				log(('This directory is currently linked to project ' + (''+linkedProject.id).cyan) + ' on Shipyard.');
				log('If you want to link it to a different backend, please run `yarr unlink` first.'.grey);
				log('NOTE: Unlinking a directory does not affect its views or assets directories.'.grey);
				return _done();
			});
		}


		// TODO: Create views directory
		// TODO: Create assets directory
		// TODO: If either exists, warn user that the front-end stuff in there may not match up with the app they're linking.

		// Create shipyard.json file
		writeLinkfile(function (err) {
			if (err) return log.error(err);

			log();
			logHR();
			log('Directory is now linked to ' + ('"'+conf.selectedApp.fullName+'"').cyan + '    ' + (''+conf.selectedApp.url).grey);
			log('Run `yarr preview` to run the preview server.');
			log(('Created linkfile at: '+jsonPath).grey);
			// log('Would you like to link it with a different project?');
			// log('Any files in this directory, e.g. views and assets, will be left alone.'.grey);
			
			_done();

		}, {});

	});


// $ yard unlink
program
	.command('unlink')
	.description('wipe Shipyard link from the current dir')
	.action(function () {

		// Lookup location of shipyard.json file
		var jsonPath = process.cwd() + '/shipyard.json';
		jsonPath = path.resolve(jsonPath);

		fs.unlink(jsonPath, function (err) {
			if (err) {
				log();
				log('This directory is not linked to a Shipyard app.'.grey);
				return _done();
			}
			log();
			logHR();
			log('Link removed.');
			log(('This directory is no longer linked to a Shipyard project.').grey);
			log(('Removed linkfile: '+jsonPath).grey);

			_done();
		});
	});



// $ yard preview
program
	.command('preview')
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
			_runApp: ['target', runApp]

		}, _done);
		
	});


// $ yard configure
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
			'Set location for cached Shipyard credentials',
			'Configure shipyard endpoint'
		],
		{
			'*': function ( choice, index ){
				log();
				logHR();
				log.error('Not implemented yet!');
				return;
			}
		});
	});


// $ yard compile
program
	.command('compile')
	.description('compile project into a deployable Node.js server')
	.action(function () {
		log();
		logHR();
		log.error('Not implemented yet!');
		return;
	});



// $ yard *
program
	.command('*')
	.action(program.help);



program
	.parse(process.argv);























/**
 * Look up the configuration for this CLI tool
 */
function readConfig (cb) {
	var cliConfigPath = path.resolve(__dirname, PATH_TO_USERCONFIG);
	util.parseJSONFile(cliConfigPath, function (err, config) {
		
		// If an error occured, the config file probably doesn't exist.
		// So try creating it
		if (err) {

			// Use defaults
			config = util.stringify(CLI_CONFIG_DEFAULTS);
			
			// If stringification failed, give up
			if (!config) return cb('Could not stringify Shipyard config file.');

			// Write to disk
			log.verbose('Saving CLI config to ' + cliConfigPath + '...');
			fs.writeFile(cliConfigPath, config, function (err) {
				if (err) {
					log.error('Could not save `.cliconfig.json` config file for this command-line tool in the directory where Shipyard is installed.');
					return cb('Error :: ' + util.inspect(err));
				}
				return cb(null, CLI_CONFIG_DEFAULTS);
			});
			return;
		}

		// Ensure configured shipyardURL has no trailing slash.
		config.shipyardURL = util.str.rtrim(config.shipyardURL, '/');

		// CLI config loaded successfully- save it to `conf`
		log.verbose('Loaded config :: ', config);
		conf.config = config;

		return cb();
	});
}





/**
 * Attempt to read the user's shipyard secret
 * from their local shipyard secret file.
 */
function readSecret (cb) {
	if (conf.credentials) return cb();

	var pathToCredentials = conf.config.pathToCredentials;
	pathToCredentials = path.resolve(conf.config.pathToCredentials);

	util.parseJSONFile(pathToCredentials, function (err, credentials) {
		
		// If an error occured, the secret file probably doesn't exist
		// at the configured location. So prompt user to log in
		// and then create a new one.
		if (err) return cb();

		// Credentials loaded successfully- pass 'em on.
		conf.credentials = credentials;
		return cb();

	});
}




/**
 * Fetch a list of the user's previewable shipyard apps
 */
function fetchApps (cb) {
	if (conf.projects) return cb();

	api.getApps({
		baseURL: conf.config.shipyardURL,
		secret: conf.credentials.secret
	}, function (err, response) {
		if (err) return cb(err);
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
	log('Login to Shipyard:'.green);
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
				log('-_-'.grey,'\n');
				return;
			}
			return cb(err);
		}

		api.login({
			baseURL: conf.config.shipyardURL,
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
				return cb('Unexpected response from Shipyard (no secret):' + util.inspect(response));
			}
			

			var credentials = {
				secret: response.secret,
				username: response.username || '???'
			};
			
			// If login was successful sringify and write the credentials file to disk
			var stringifiedCredentials = util.stringify(credentials);
			if (!stringifiedCredentials) return cb('Could not stringify credentials file.');
			fs.writeFile(path.resolve(conf.config.pathToCredentials), stringifiedCredentials, function (err) {
				if (err) {
					log.error('Login failed.');
					log('Could not save Shipyard credentials file in the configured directory ('+pathToCredentials+')');
					log('That directory may not exist, or there could be a permissions issue.'.grey);
					return cb(util.inspect(err));
				}

				log();
				logHR();
				log('This computer is now logged in to Shipyard as '+((credentials.username).cyan));
				log(('Shipyard credentials were saved in `'+conf.config.pathToCredentials+'`').grey);
				log('You can change the location of this file by running `yarr configure`'.grey);
				conf.credentials = credentials;
				return cb();
			});
		});
	});
}



function doChooseApp (cb) {
	if (conf.selectedApp) return cb();

	fetchApps(function (err) {
		if (err) return cb(err);

		// No apps exist, output an error message
		if (!conf.projects || !conf.projects.length) {
			return cb(__.NO_APPS_AVAILABLE);
		}

		// Map apps for use in the menu
		var apps = util.map(conf.projects, function (app) {
			return ((app.fullName).yellow) + '   ' + ('/' + conf.credentials.username + '/' + (app.name||'')).grey;
		});

		program
		.chooseFromMenu (
		__.CHOOSE_APP_TO_LIFT,
		apps,
		{
			'*': function ( choice, index ){
				conf.selectedApp = conf.projects[index];
				cb();
			}
		});
	});

}



function runApp (cb) {
	if (conf.runningApp) return cb('Preview server is already running!');

	var projectName = (conf.selectedApp.fullName).cyan;
	
	log();
	log('Running ' + projectName + '...');
	
	logHR();
	log('Preview server is warming up...'.yellow);
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

	delayedLog(50)('Synchronizing app with Shipyard...'.grey);
	delayedLog(450)('Calibrating machines...'.grey);
	delayedLog(2500)('Hold tight, this can take a moment...'.yellow);

	// Give up after 30 seconds
	delayedLog.timers.push(setTimeout(function () {
		log.error('The preview server isn\'t starting...');
		log.error('Please try again later.  If the problem persists, check @shipyardio for updates.');
		for (var i in delayedLog.timers) {
			clearTimeout(delayedLog.timers[i]);
		}
		return;
	}, 30000));


	// Start sails and pass it command line arguments
	var sails = new Sails();
	sails.lift({
		shipyard: {
			src: {
				secret: conf.credentials.secret,
				url: conf.config.shipyardURL + '/' + conf.selectedApp.id + '/modules'
			}
		},
		hooks: {
			moduleloader: require('sailshook-shipyard-moduleloader'),
			shipyard: require('sailshook-shipyard'),
			controllers: false,
			policies: false,
			services: false,
			userhooks: false
		}
	}, function (err) {
		if (err) return cb(err);
		
		// Clear obnoxious timers
		for (var i in delayedLog.timers) {
			clearTimeout(delayedLog.timers[i]);
		}

		// Keep track of running app
		conf.runningApp = sails;
	});
}




function logout (cb) {
	log.verbose('Erasing Shipyard credentials...');

	// Lookup location of json credentials file
	var pathToCredentials = conf.config.pathToCredentials;
	pathToCredentials = path.resolve(conf.config.pathToCredentials);

	fs.unlink(pathToCredentials, function (err) {

		// If an error occurred, the file probably doesn't exist
		// TODO: do smarter error negotiation here
		if (err) {
			log();
			log('This computer is not currently logged in to Shipyard.'.grey);
			return cb();
			// log.error('Logout failed!');
			// log(('Shipyard credentials file could not be found in the configured directory (' + pathToCredentials + ')').grey);
			// return cb(err);
		}

		log();
		logHR();
		log('This computer has been logged out of Shipyard.');
		log(('Shipyard credentials were erased from `' + pathToCredentials + '`').grey);
		return cb();
	});
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

		// Fetch apps available to this user from shipyard server
		// or prompt user for login credentials if necessary.
		apps: ['credentials', fetchApps],

		// Ask user to pick an app
		target: ['apps', doChooseApp],

	}, function (err) {
		if (err) return cb(err);

		// Write the linkfile to disk
		var json = util.stringify(conf.selectedApp);
		if (!json) return log.error('Invalid project id ('+conf.selectedApp.id+')-- could not stringify.');
		
		// Determine expected location of shipyard.json file
		var jsonPath = process.cwd() + '/shipyard.json';
		jsonPath = path.resolve(jsonPath);

		// Then just write it
		fs.writeFile(jsonPath, json, cb);
	});
}




function acquireLink (cb) {
	if (conf.selectedApp) return cb();

	async.auto({

		// Load config
		config: readConfig,

		// Use cached credentials or enter login flow
		credentials: authenticate,
		
		readLinkfile: ['credentials', readLink],

		// Fetch apps available to this user from shipyard server
		// or prompt user for login credentials if necessary.
		// Ask user to pick an app
		target: ['readLinkfile', doChooseApp],

		writeLinkfile: ['target', writeLinkfile]

	}, cb);
}



function readLink (cb) {
	if (conf.selectedApp) return cb();

	// Determine expected location of shipyard.json file
	var jsonPath = process.cwd() + '/shipyard.json';
	jsonPath = path.resolve(jsonPath);

	// If file does not exist, exit silently.
	if (!fs.existsSync(jsonPath)) return cb();

	util.parseJSONFile(jsonPath, function (err, json){
		if (err) {
			log.error('Linkfile in current directory is corrupted.');
			log.error('Please run `yarr unlink` here, then try again.'.grey);
			return cb(err);
		}

		// Save reference to target
		conf.selectedApp = json;

		cb();
	});
}



// stub function to use as a final callback
// Log an error if there is one, otherwise throw in a newline
function _done (err) {
	if (err) return log.error(err);
	log();
}



function logHR() {
	log();
	log('--'.grey);
}
