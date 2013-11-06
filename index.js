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
var CLI_CONFIG_DEFAULTS = {

	// Path to Shipyard's secret JSON file
	pathToCredentials: path.resolve(util.homeDirectory() + '/.shipyard.secret.json'),

	// URL where shipyard is hosted
	shipyardURL: 'http://localhost:1337'
	// shipyardURL: 'http://creepygiggles.com'
};


program
	.version('0.0.1')
	.parse(process.argv);


async.auto({

	// Load config
	config: readConfig,

	// Look up the secret on the user's system
	credentials: ['config', readSecret],

	// Log in
	login: ['credentials', doLogin],

	// If secret is invalid, delete it and send user to the authentication flow
	// If secret is missing, send user to the authentication flow
	// If secret is valid, look up apps
	// Fetch apps available to this user from shipyard server
	// or prompt user for login credentials if necessary.
	apps: ['login', fetchApps],

	// Ask user to pick an app
	chooseApp: ['apps', doChooseApp],

	_runApp: ['chooseApp', runApp]
	

}, function done (err, data) {
	if (err) {
		return log.error(err);
	}
	// Done.
});


/**
 * Look up the configuration for this CLI tool
 */
function readConfig (cb, data) {
	var PATH_TO_USERCONFIG = './.cliconfig.json';
	PATH_TO_USERCONFIG = path.resolve(__dirname, PATH_TO_USERCONFIG);

	util.parseJSONFile(PATH_TO_USERCONFIG, function (err, config) {
		
		// If an error occured, the config file probably doesn't exist.
		// So try creating it
		if (err) {

			// Use defaults
			config = util.stringify(CLI_CONFIG_DEFAULTS);
			
			// If stringification failed, give up
			if (!config) return cb('Could not stringify Shipyard config file.');

			// Write to disk
			log.verbose('Saving CLI config to ' + PATH_TO_USERCONFIG + '...');
			fs.writeFile(PATH_TO_USERCONFIG, config, function (err) {
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
		
		// Credentials loaded successfully- pass it on.
		if (!err) {
			return cb(null, credentials);
		}

		// If an error occured, the secret file probably doesn't exist
		// at the configured location. So prompt user to log in
		// and then create a new one.
		log.error(err);
		cb();

	});
}




/**
 * Fetch a list of the user's previewable shipyard apps
 */
function fetchApps (cb, data) {

	// Talk to shipyard server to fetch the list of apps accessible by this user
	api.getApps({
		baseURL: data.config.shipyardURL,
		secret: data.credentials.secret
	}, function (err, response) {
		if (err) return cb(err);
		cb(null, response);

		// If an authentication error occurred, try to login again
		// If login failed, give up
		// If login was successful, try to fetch apps again.
	});
}



function doLogin (cb, data) {
	// Skip this step if credentials are known
	if ( data.credentials ) return cb();

	// Start the prompt
	// Get two properties from the user: username and password
	//
	prompt.start();
	prompt.get({
		properties: {
			username: { description: 'username' },
			password: { description: 'password' }
		}
	}, function(err, userInput) {
		if (err) return cb(err);
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
					return cb('Invalid username/password combination.');
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











// program.prompt('name: ', function(name){
//   console.log('hi %s', name);
// });

 // the prompt
	// // Get two properties from the user: username and email
	// //
	// prompt.start();
	// prompt.get(['username', 'email'], function(err, result) {
	// 	if (err) return exits.err(err);
	// 	exits.

// var list = ['tobi', 'loki', 'jane', 'manny', 'luna'];

// console.log('Choose the coolest pet:');
// program.choose(list, function(i){
//   console.log('you chose %d "%s"', i, list[i]);
// });

// program
//   .command('setup [env]')
//   .description('run setup commands for all envs')
//   .option('-s, --setup_mode [mode]', 'Which setup mode to use')
//   .action(function(env, options){
//     var mode = options.setup_mode || 'normal';
//     env = env || 'all';
//     console.log('setup for %s env(s) with %s mode', env, mode);
//   });

// program
//   .command('exec <cmd>')
//   .description('execute the given remote cmd')
//   .option('-e, --exec_mode <mode>', 'Which exec mode to use')
//   .action(function(cmd, options){
//     console.log('exec "%s" using %s mode', cmd, options.exec_mode);
//   }).on('--help', function() {
//     console.log('  Examples:');
//     console.log();
//     console.log('    $ deploy exec sequential');
//     console.log('    $ deploy exec async');
//     console.log();
//   });

// program
//   .command('*')
//   .action(function(env){
//     console.log('deploying "%s"', env);
//   });

// program.parse(process.argv);




// program
// 	.version('0.0.1');
// // .option('-C, --chdir <path>', 'change the working directory')
// // .option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
// // .option('-T, --no-tests', 'ignore test hook');


// program
// 	.command('*')
// 	.action(function(env) {
// 		console.log('deploying "%s"', env);
// 	});




