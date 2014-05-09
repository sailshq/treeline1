var _ioClient = require('./sails.io')(require('socket.io-client'));
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var async = require('async');
var log = require('./logger');
var buildDictionary = require('sails-build-dictionary');
var _ = require('lodash');

module.exports = function(sails) {

	var socket;
	var self = this;

	return {
		start: function(config, options, cb) {

			// Get the Shipyard URL
			var src = config.src;
			self.options = _.clone(options);
			delete self.options.forceSync;

			// Get the socket.io client connection
			socket = _ioClient.connect(config.src.baseURL);
			self.syncModels = require('./lib/syncModels')(sails, socket);
			self.syncServices = require('./lib/syncServices')(sails, socket);
			self.syncControllers = require('./lib/syncControllers')(sails, socket);

			cb = cb || function(){};
			log.verbose("Yarr WATCH started.");

			// When Sails lowers, stop watching
			sails.on('lower', stop);

			options = options || {};
			options.noOrmReload = true;

			// Handle initial socket connection to Sails
			socket.on('connect', function() {

				// Subscribe to updates
				socket.get(config.src.baseURL + '/project/subscribe/'+config.src.projectId+'?secret='+config.src.secret);

				// Tasks to run
				var tasks = {};
				tasks.models = function(cb) {
					// Load all models from Shipyard, but don't reload ORM (since Sails hasn't started yet)
					self.syncModels.reloadAllModels(config, options, function(err) {
						if (err) {return cb(err);}
						// Handle model pubsub messages from Sails
						return cb();
					});
				};

				if (!options.modelsOnly) {
					_.extend(tasks, {
						services: function(cb) {
							// Load all models from Shipyard, but don't reload ORM (since Sails hasn't started yet)
							self.syncServices.reloadAllServices(config, options, function(err) {
								if (err) {return cb(err);}
								// Handle model pubsub messages from Sails
								return cb();
							});
						},
						controllers: function(cb) {
							// Load all models from Shipyard, but don't reload ORM (since Sails hasn't started yet)
							self.syncControllers.reloadAllControllers(config, options, function(err) {
								if (err) {return cb(err);}
								// Handle model pubsub messages from Sails
								return cb();
							});
						}
					});
				}
				async.parallel(tasks, function(err) {
					if (err) return cb(err);
					socket.on('project', handleProjectMessage);
					return cb();
				});

			});

			socket.on('disconnect', function() {
				sails.log.error("Shipyard went offline; lowering Sails.");
				sails.lower(function(){process.exit();});
			});
		}

	};


	function stop() {
		sails.log.verbose("Yarr WATCH stopped.");
	}


	function handleProjectMessage(message) {

		// Handle model updates
		if (message.verb == 'messaged' && message.data.message == 'model_updated') {
			self.syncModels.writeModels(message.data.models, self.options, function(err) {
				reloadOrm();
			});

		}

		// Handle model updates
		if (message.verb == 'messaged' && message.data.message == 'controller_updated' && !self.options.modelsOnly) {
			self.syncControllers.writeControllers(message.data.controllers, function(err) {
				reloadOrm();
			});

		}

	}

	function reloadOrm(cb) {

		// Reload controller middleware
		sails.hooks.controllers.loadAndRegisterControllers(function() {

			sails.once('hook:orm:reloaded', function() {

				// Flush router
				sails.router.flush();
				// Reload blueprints
				sails.hooks.blueprints.bindShadowRoutes();

				return cb && cb();

			});

			// Reload ORM
			sails.emit('hook:orm:reload');

		});

	}

};