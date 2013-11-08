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
prompt.message = '>'.cyan;
prompt.delimiter = '';

program
	.version('0.0.1');




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
		authenticate(_done);
	});



// $ yard link
program
	.command('link')
	.description('link current dir to one of your projects')
	.action(function () {

	});


// $ yard preview
program
	.command('preview')
	.description('preview the app in the current dir')
	.action(function () {
		async.auto({

			// Use cached credentials or enter login flow
			credentials: authenticate,

			// Fetch apps available to this user from shipyard server
			// or prompt user for login credentials if necessary.
			apps: ['login', fetchApps],

			// Ask user to pick an app
			chooseApp: ['apps', doChooseApp],

			_runApp: ['chooseApp', runApp]
			

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
		log.error('Not implemented yet!');
		return;
	});





// Process arguments!
program
	.parse(process.argv);


/**
 * Look up the configuration for this CLI tool
 */
function readConfig (cb, data) {
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

		// CLI config loaded successfully- pass it on.
		log.verbose('Loaded config :: ', config);
		return cb(null, config);
	});
}


/**
 * Attempt to read the user's shipyard secret
 * from their local shipyard secret file.
 */
function readSecret (cb, data) {
	var pathToCredentials = data.config.pathToCredentials;
	pathToCredentials = path.resolve(data.config.pathToCredentials);

	util.parseJSONFile(pathToCredentials, function (err, credentials) {
		
		// If an error occured, the secret file probably doesn't exist
		// at the configured location. So prompt user to log in
		// and then create a new one.
		if (err) return cb();

		// Credentials loaded successfully- pass 'em on.
		return cb(null, credentials);

	});
}




/**
 * Fetch a list of the user's previewable shipyard apps
 */
function fetchApps (cb, data) {
	api.getApps({
		baseURL: data.config.shipyardURL,
		secret: data.credentials.secret
	}, function (err, response) {
		if (err) return cb(err);
		cb(null, response);
	});
}



function doLogin (cb, data) {

	// Skip this step if credentials are known
	if ( data && data.credentials ) return cb();

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
			baseURL: data.config.shipyardURL,
			params: {
				username: userInput.username,
				password: userInput.password
			}
		}, function (err, response) {
			// Login failed - could be various reasons
			if (err) {
				if (err.status === 400 && err.errors) {
					log.error('Sorry, I don\'t recognize that username/password combination.');
					log.error('Please try again, or hit <CTRL+C> to cancel.');
					return doLogin(cb, data);
				}
				return cb(err);
			}

			if (!response || !response.secret) return cb('Unexpected response from Shipyard (no secret):' + util.inspect(response));
			
			// If login was successful write the credentials file
			// Wrap generatedSecret from Shipyard
			var credentials = {secret: response.secret };

			// Stringify credentials object
			var stringifiedCredentials = util.stringify(credentials);

			// If it failed, give up
			if (!stringifiedCredentials) return cb('Could not stringify credentials file.');

			// If login was successful, stringify and write to disk
			var pathToCredentials = data.config.pathToCredentials;
			pathToCredentials = path.resolve(data.config.pathToCredentials);
			fs.writeFile(pathToCredentials, stringifiedCredentials, function (err) {
				if (err) {
					log.error('Could not save Shipyard credentials file in the configured directory:', pathToCredentials);
					return cb('Error :: ' + util.inspect(err));
				}
				log('Saved your Shipyard credentials in',data.config.pathToCredentials,'for next time.');
				log('You can change this location by running `yarr configure`'.grey);
				return cb(null, credentials);
			});
		});
	});
}



function doChooseApp (cb, data) {


	// No apps exist, output an error message
	if (!data.apps || !data.apps.length) {
		return cb(__.NO_APPS_AVAILABLE);
	}

	// Map apps for use in the menu
	var apps = util.map(data.apps, function (app) {
		return app.name + ' (' + app.fullName + ')';
	});

	program
		.chooseFromMenu (
		__.CHOOSE_APP_TO_LIFT,
		apps,
		{

			'*': function ( choice, index ){
				cb(null, data.apps[index]);
			}

		});
}



function runApp (cb, data) {
	log.verbose('Running project #', data.chooseApp.id);
	var projectID = data.chooseApp.id;

	// Start sails and pass it command line arguments
	var sails = new Sails();
	sails.lift({
		shipyard: {
			src: {
				secret: data.credentials.secret,
				url: data.config.shipyardURL + '/' + projectID + '/modules'
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
	}, cb);
}


/**
 * authenticate
 *
 * Shortcut for readConfig and [credentials or login]
 */
function authenticate (cb) {

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

	}, function (err, data) {
		if (err) return cb(err);

		// Get credentials from the different places they could have ended up
		cb(null, data.credentials || data.doLogin);
	});
}


function logout (cb, data) {
	log.verbose('Erasing Shipyard credentials...');

	// Lookup location of json credentials file
	var pathToCredentials = data.config.pathToCredentials;
	pathToCredentials = path.resolve(data.config.pathToCredentials);

	fs.unlink(pathToCredentials, function (err) {

		// If an error occurred, the file probably doesn't exist
		// TODO: do smarter error negotiation here
		if (err) {
			log('You are already logged out.'.grey);
			return cb();
			// log.error('Logout failed!');
			// log(('Shipyard credentials file could not be found in the configured directory (' + pathToCredentials + ')').grey);
			// return cb(err);
		}
		log('Your computer has been logged out of Shipyard.');
		log('Shipyard credentials were erased from this computer.'.grey);
		return cb();
	});
}



// stub function to use as a final callback
function _done (err) {
	if (err) return log.error(err);
}