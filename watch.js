var path = require('path');
var fs = require('fs');
var glob = require('glob');
var async = require('async');
var debug = require('debug')('treeline');
var log = require('./logger');
var buildDictionary = require('sails-build-dictionary');
var chalk = require('chalk');
var _ = require('lodash');

module.exports = function(sails) {

	var socket;
	var self = this;

	return {
		start: function(config, options, cb) {

      var _ioClient = require('./sails.io')(require('socket.io-client'));

			// Get the Treeline URL
			var src = config.src;
			self.options = _.clone(options);
			delete self.options.forceSync;

			// Get the socket.io client connection
      _ioClient.sails.autoConnect = false;
      _ioClient.sails.environment = "production";

      // Only use websockets to connect
      _ioClient.sails.transports = ["websocket"];

			socket = _ioClient.sails.connect(config.src.baseURL, {multiplex: false});
			self.syncMachines = require('./lib/syncMachines')(sails, socket);
			self.syncModels = require('./lib/syncModels')(sails, socket);
			self.syncServices = require('./lib/syncServices')(sails, socket);
			self.syncControllers = require('./lib/syncControllers')(sails, socket);
      self.syncConfig = require('./lib/syncConfig')(sails, socket);
      self.syncScaffold = require('./lib/syncScaffold')(sails, socket);

      // Socket message handler queue
      var socketMessageHandlerQueue = async.queue(function(task, cb) {
        debug('Processing task :: ', task.name);
        switch (task.name) {
          case 'handleProjectMessage':
            handleProjectMessage(task.message, cb);
            break;
        }
      });
      // Only handle one socket message at a time
      socketMessageHandlerQueue.concurrency = 1;

			cb = cb || function(){};
			// log.verbose("Treeline WATCH started.");

			// When Sails lowers, stop watching
			sails.on('lower', stop);

			options = options || {};
			options.noOrmReload = true;

			// Handle initial socket connection to Sails
      socket.on('connect', initialConnect);

      // Initial connection flag
      var alreadyConnected = false;

			function initialConnect() {

				// Subscribe to updates
				socket.get(config.src.baseURL + '/project/subscribe/'+config.src.projectId+'?secret='+config.src.secret);

				// Tasks to run
				var tasks = {};

        tasks.scaffolds = function(cb) {
          self.syncScaffold.createResponse(config, options, cb);
        };

				if (!options.modelsOnly) {
					_.extend(tasks, {
						controllers: function(cb) {
							// Load all models from Treeline, but don't reload ORM (since Sails hasn't started yet)
							self.syncControllers.reloadAllControllers(config, options, function(err) {
								if (err) {return cb(err);}
								// Handle model pubsub messages from Sails
								return cb();
							});
						},
            config: function(cb) {
              self.syncConfig.reloadAllConfig(config, options, function(err) {
                cb(err);
              });
            },
            machines: function(cb) {
              self.syncMachines.reloadAllMachinePacks(config, options, function(err) {
                cb(err);
              });
            }
					});
				}

        tasks.models = function(cb) {
          // Load all models from Treeline, but don't reload ORM (since Sails hasn't started yet)
          self.syncModels.reloadAllModels(config, options, function(err) {
            if (err) {return cb(err);}
            // Handle model pubsub messages from Sails
            return cb();
          });
        };

				async.series(tasks, function(err) {
					if (err) return cb(err);
					socket.on('project', function(message) {
            debug('Received socket message from Treeline:',message);
            socketMessageHandlerQueue.push({name: 'handleProjectMessage', message: message});
          });
          if (!alreadyConnected) {
            alreadyConnected = true;
            return cb();
          } else {
            log(chalk.green("Treeline mothership has returned; praise the sun!"));
          }
				});

			}

			socket.on('disconnect', function() {
				sails.log.error("Treeline mothership went offline; attempting to reconnect...");
			});
		}

	};


	function stop() {
		sails.log.verbose("Treeline WATCH stopped.");
	}


	function handleProjectMessage(message, cb) {

		// Handle model updates
		if (message.verb == 'messaged' && message.data.message == 'model_updated') {
			self.syncModels.writeModels(message.data.models, self.options, function(err) {
				return reloadOrm(cb);
			});

		}

    // Handle model updates
    else if (message.verb == 'messaged' && message.data.message == 'route_updated' && !self.options.modelsOnly) {
      if (!options.modelsOnly) {
				async.series({
					controllers: function(cb) {
						// Load all models from Treeline, but don't reload ORM (since Sails hasn't started yet)
						self.syncControllers.reloadAllControllers(null, self.options, function(err) {
							if (err) {return cb(err);}
							return cb();
						});
					},
          config: function(cb) {
            self.syncConfig.reloadAllConfig(null, self.options, function(err, config) {
              sails.config.treeline = config;
              cb(err);
            });
          },
          machines: function(cb) {
            self.syncMachines.reloadAllMachinePacks(null, self.options, function(err) {
              cb(err);
            });
          },
          models: function(cb) {
            self.syncModels.reloadAllModels(null, self.options, cb);
          }
				}, function(err, done) {
					if (err) {
            sails.log.error("Treeline encountered an error trying to update your app:");
            sails.log.error(err);
            sails.log.error("If this problem persists, try quitting and restarting treeline.");
          } else {
					 return reloadOrm(cb);
          }
				});
			}

      else {
        return cb();
      }

		}

    else {
      return cb();
    }

	}

	function reloadOrm(cb) {

    // Default callback to an empty fn
    cb = cb || function(){};

    // Wrap callback in a fn that turns off maintenance mode
    var origCb = cb;
    cb = function() {
      sails.config && (sails.config.maintenance = false);
      origCb();
    };

    // Turn on maintenance mode if available
    sails.config && (sails.config.maintenance = true);

    // Clear all node machines out of the require cache
    _.each(_.keys(require.cache), function(key) {
      if (key.match(/\/node_machines\//)) {
        delete require.cache[key];
      }
    });

		// Reload controller middleware
		sails.hooks.controllers.loadAndRegisterControllers(function() {

			sails.once('hook:orm:reloaded', function() {

        // Merge with original explicit routes
        sails.config.routes = _.extend({}, sails.router.explicitRoutes, sails.config.routes);

				// Flush router
				sails.router.flush(sails.config.routes);

				// Reload blueprints
				sails.hooks.blueprints.bindShadowRoutes();

        // Reload machines
        sails.hooks.machines.loadMachines(cb);

			});

			// Reload ORM
			sails.emit('hook:orm:reload');

		});

	}

};
