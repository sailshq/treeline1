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

// Shipyard api wrapper
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

	// Path to Shipyard's secret JSON file
	pathToCredentials: path.resolve(util.homeDirectory() + '/.shipyard.secret.json'),

	// URL where shipyard is hosted
	shipyardURL: 'http://localhost:1492'
};

// Customize the prompt.
//
prompt.message = '>'.yellow;
prompt.delimiter = '';


// The `conf` global is shared throughout the CLI utility
// This was used instead of async.auto's `data` argument to avoid repetetive code.
var conf = {};


// $ yarr -v
// Make version option case-insensitive
if (argv.v || argv.V) {
	process.argv.push('-V');
}





// Start commander
program
	.version('0.0.1');


// $ yarr logout
program
	.command('logout')
	.description('wipe cached Shipyard secret')
	.action(function () {
		async.auto({
			config: readConfig,
			_logout: ['config', logout]
		}, function (err) {

			// If an error occurred, the file probably doesn't exist
			// TODO: do smarter error negotiation here
			if (err) {
				log();
				log('This computer is not currently logged in to Shipyard.'.grey);
				return _done();
				// log.error('Logout failed!');
				// log(('Shipyard credentials file could not be found in the configured directory (' + pathToCredentials + ')').grey);
				// return cb(err);
			}

			log();
			_logHR();
			log('This computer has been logged out of Shipyard.');
			log(('Shipyard credentials were erased from `' + path.resolve(conf.config.pathToCredentials) + '`').grey);
			_done();
		});
	});



// $ yarr login
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



// $ yarr link
program
	.command('link')
	.description('link current dir to one of your projects')
	.action(function () {

		// Determine expected location of shipyard.json file
		var jsonPath = process.cwd() + '/shipyard.json';
		jsonPath = path.resolve(jsonPath);

		// Check that shipyard.json doesn't already exist
		if (fs.existsSync(jsonPath)) {

			// TODO: remove the `exists` check-- leads to transactional race conditions.
			return fse.readJSON(jsonPath, function (err, linkedProject){
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
			_logHR();
			log('Directory is now linked to ' + ('"'+conf.targetProject.fullName+'"').cyan);
			log('Run `yarr preview` to run the preview server.');
			log(('Created linkfile at: '+jsonPath).grey);
			// log('Would you like to link it with a different project?');
			// log('Any files in this directory, e.g. views and assets, will be left alone.'.grey);

			_done();

		}, {});

	});


// $ yarr unlink
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
			_logHR();
			log('Link removed.');
			log(('This directory is no longer linked to a Shipyard project.').grey);
			log(('Removed linkfile: '+jsonPath).grey);

			_done();
		});
	});



// $ yarr preview
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
			_runApp: ['target', runApp]

		}, _done);

	});


// $ yarr configure
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
				_logHR();
				log.error('Not implemented yet!');
				return;
			}
		});
	});


// $ yarr compile
program
	.command('compile')
	.description('compile project into a deployable Node.js server')
	.action(function () {
		log();
		_logHR();
		log.error('Not implemented yet!');
		return;
	});



// $ yarr status
program
	.command('status')
	.description('info about the Shipyard project in the current directory')
	.action(function () {
		async.auto({
			config: readConfig,
			credentials: ['config', readSecret],
			target: ['credentials', readLink],
			logStatus: ['target', function (cb) {

				log();
				log('=='.yellow+' Shipyard Status '+'=='.yellow);

				// Account information
				if (!conf.credentials) {
					log('This computer is not currently logged in to Shipyard.'.grey);
				}
				else {
					log('This computer is logged-in to Shipyard as '+((conf.credentials.username).cyan)+ '.');
				}
				// log();

				// Project information
				if (!conf.targetProject) {
					log(('This directory (' + process.cwd() + ') is not linked to a Shipyard app.').grey);
				}
				else {
					log('This directory is linked to '+((''+conf.targetProject.fullName).cyan) + '.');
				}

				// Done.
				cb();

			}]
		}, _done);
	});



// $ yarr *
program
	.command('*')
	.action(program.help);



program
	.parse(process.argv);


// If no arguments were provided, i.e. `yarr`
// treat it just like `yarr --help`
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
					log.error('Could not stringify and/or save `.cliconfig.json` config file for this command-line tool in the directory where Shipyard is installed.');
					return cb(err);
				}
				return cb();
			});
			return;
		}

		var jsonPath = process.cwd() + '/shipyard.json';
		jsonPath = path.resolve(jsonPath);

		// Sort of a cheap hack to attempt to read a shipyard URL from the project's shipyard.json file
		// if it exists, so that we can use different Shipyard instances for different projects.
		fse.readJSON(jsonPath, function (err, json){

			config.shipyardURL = (!err && json.shipyardURL) ? json.shipyardURL : config.shipyardURL;
			config.pathToCredentials = (!err && json.pathToCredentials) ? json.pathToCredentials : config.pathToCredentials;

			// Ensure configured shipyardURL has no trailing slash.
			config.shipyardURL = util.str.rtrim(config.shipyardURL, '/');

			// CLI config loaded successfully- save it to `conf`
			log.verbose('Loaded config :: ', config);
			conf.config = config;

			return cb();

		});

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
 * Fetch a list of the user's previewable shipyard apps
 */
function fetchApps (cb) {
	if (conf.projects) return cb();

	api.getApps({
		baseURL: conf.config.shipyardURL,
		secret: conf.credentials.secret
	}, function (err, response) {
		if (err) {

			// If there is an authentication problem,
			// wipe credentials and attempt to login again
			if (err.status == 403) {
				log('Sorry, looks like your account secret has changed, or the local file has become corrupt.');
				log('Please run `yarr logout`, then try again.'.grey);
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
				log('\n');
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
				username: response.username || '???',
				accountId: response.id
			};

			// If login was successful stringify and write the credentials file to disk
			fse.outputJSON( path.resolve(conf.config.pathToCredentials),
				credentials, function (err) {
				if (err) {
					log.error('Login failed.');
					log('Could not stringify and/or save Shipyard credentials file in the configured directory ('+pathToCredentials+')');
					log('That directory may not exist, or there could be a permissions issue.'.grey);
					return cb(util.inspect(err));
				}

				log();
				_logHR();
				log('This computer is now logged in to Shipyard as '+((credentials.username).cyan));
				log(('Shipyard credentials were saved in `'+conf.config.pathToCredentials+'`').grey);
				log('You can change the location of this file by running `yarr configure`'.grey);
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
							baseURL: conf.config.shipyardURL,
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



function runApp (cb) {

	if (conf.runningApp) return cb('Preview server is already running!');

	var projectName = (conf.targetProject.fullName).cyan;

	log();
	log('Running ' + projectName + '...');

	_logHR();
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


	var sails = new Sails();
	var watch = require('./watch')(sails);
	var shipyardConfig = {
		src: {
			secret: conf.credentials.secret,
			baseURL: conf.config.shipyardURL,
			url: conf.config.shipyardURL + '/' + conf.targetProject.id + '/modules',
			projectId: conf.targetProject.id,
			protocol: 'http://',
			host: 'localhost',
			port: 4444,
			prefix: '',
			endpoint: '/modules'
		}
	};
	var options = conf.targetProject.options || {};
	_.defaults(options, {
		forceSync: program.args[0].forceSync,
		modelsOnly: program.args[0].modelsOnly,
		export: program.args[0].export
	});

	var liftOptions = {
		models: {
			migrate: 'alter'
		},
		shipyard: shipyardConfig
	};

	// Load the app's local .sailsrc
	var localSailsRc = rc('sails', {}, ["--config", path.join(process.cwd(), '.sailsrc')]);

	// Delete keys that `rc` puts in that we don't want
	delete localSailsRc[0];
	delete localSailsRc[1];
	delete localSailsRc.config;

	// Merge our lift options
	_.extend(liftOptions, localSailsRc);

    // Make sure the Yarr plugin is listed
    liftOptions.plugins = liftOptions.plugins || {yarr: true};
    liftOptions.plugins.yarr = liftOptions.plugins.yarr || true;

	liftOptions.moduleLoaderOverride = function(sails, orig) {
		var loadUserConfig = orig.loadUserConfig;
		return {
			loadUserConfig: function(cb) {
	          buildDictionary.aggregate({
	            dirname   : sails.config.appPath + "/node_modules/yarr/config/",
	            exclude   : ['locales', 'local.js', 'local.json', 'local.coffee'],
	            excludeDirs: /(locales|env)$/,
	            filter    : /(.+)\.(js|json|coffee)$/,
	            identity  : false
	          }, function (err, yarrConfigs) {
	          	loadUserConfig(function(err, userConfigs) {
	          		if (err) {return cb(err);}
	          		cb(null, sails.util.merge(yarrConfigs, userConfigs));
	          	});
	          });
			},
		    /**
		     * Load app controllers
		     *
		     * @param {Object} options
		     * @param {Function} cb
		     */
		    loadControllers: function(cb) {
		      loadApiWithPlugins(function loader (dirName, cb) {
		        buildDictionary.optional({
		          dirname: dirName,
		          filter: /(.+)Controller\.(js|coffee)$/,
		          flattenDirectories: true,
		          keepDirectoryPath: true,
		          replaceExpr: /Controller/
		        }, cb);
		      }, "controllers", cb);
		    },

		    /**
		     * Load app's model definitions
		     *
		     * @param {Object} options
		     * @param {Function} cb
		     */
		    loadModels: function (cb) {
		      loadApiWithPlugins(function loader (dirName, cb) {
		        // Get the main model files
		        buildDictionary.optional({
		          dirname   : dirName,
		          filter    : /^([^.]+)\.(js|coffee)$/,
		          replaceExpr : /^.*\//,
		          flattenDirectories: true
		        }, function(err, models) {
		          if (err) {return cb(err);}
		          // Get any supplemental files
		          buildDictionary.optional({
		            dirname   : dirName,
		            filter    : /(.+)\.attributes.json$/,
		            replaceExpr : /^.*\//,
		            flattenDirectories: true
		          }, function(err, supplements) {
		            if (err) {return cb(err);}
		            return cb(null, sails.util.merge(models, supplements));
		          });
		        });
		      }, "models", cb);
		    },

		    /**
		     * Load app services
		     *
		     * @param {Object} options
		     * @param {Function} cb
		     */
		    loadServices: function (cb) {
		      loadApiWithPlugins (function loader(dirName, cb) {
		          buildDictionary.optional({
		            dirname     : dirName,
		            filter      : /(.+)\.(js|coffee)$/,
		            depth     : 1,
		            caseSensitive : true
		          }, cb);
		      }, "services", cb);
		    }
		};
	};

	// Start watching for changes from Shipyard
	watch.start(shipyardConfig, options, function() {

		// Start sails and pass it command line arguments
		sails.lift(liftOptions, function (err) {

			if (err) return cb(err);

			// Clear obnoxious timers
			for (var i in delayedLog.timers) {
				clearTimeout(delayedLog.timers[i]);
			}

			// Keep track of running app
			conf.runningApp = sails;
		});

	});

	function loadApiWithPlugins(loader, api, cb) {
	  async.auto({
	    plugins: function(cb) {
	      async.map(Object.keys(sails.config.plugins), function(plugin, cb) {loader(sails.config.appPath + "/node_modules/" + plugin + "/api/" + api, cb);}, cb);
	    },
	    local: function(cb){loader(sails.config.paths[api], cb);}
	  }, function (err, async) {
	    if (err) {return cb(err);}
	    return cb(null, _.extend(_.merge.apply(this, async.plugins), async.local));
	  });
	}

}




function logout (cb) {
	log.verbose('Erasing Shipyard credentials...');

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

		// Fetch apps available to this user from shipyard server
		// or prompt user for login credentials if necessary.
		apps: ['credentials', fetchApps],

		// Ask user to pick an app
		target: ['apps', doChooseApp],

	}, function (err) {
		if (err) return cb(err);


		// Determine expected location of shipyard.json file
		var jsonPath = process.cwd() + '/shipyard.json';
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

		// Fetch apps available to this user from shipyard server
		// or prompt user for login credentials if necessary.
		// Ask user to pick an app
		target: ['readLinkfile', doChooseApp],

		writeLinkfile: ['target', writeLinkfile]

	}, cb);
}



function readLink (cb) {

	if (conf.targetProject) return cb();

	// Determine expected location of shipyard.json file
	var jsonPath = process.cwd() + '/shipyard.json';
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
					log.error('Please run `yarr unlink` here, then try again.'.grey);
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
		// (running `yarr status` should always result in accurate information, for instance)
		validate: ['apps', function (cb) {

			// If no target project is currently defined, skip this check
			if ( !conf.targetProject ) return cb();

			// Ensure account has access to the target app
			if ( !util.contains( util.pluck(conf.projects, 'id'), conf.targetProject.id ) ) {
				log('Sorry, you do not have permission to preview the linked project: '+conf.targetProject.fullName+'  (' + conf.targetProject.id +')');
				log('Please run `yarr unlink` here, then try again to set up a new link.'.grey);
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


