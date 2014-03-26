var _ioClient = require('./sails.io')(require('socket.io-client'));
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var async = require('async');
module.exports = function(sails) {

	var socket;

	return {
		start: function(cb) {

			// Get the Shipyard URL
			var src = sails.config.shipyard.src;

			// Get the socket.io client connection
			socket = _ioClient.connect(sails.config.shipyard.src.baseURL);

			cb = cb || function(){};
			sails.log.verbose("Yarr WATCH started.");

			// When Sails lowers, stop watching
			sails.on('lower', stop);

			// Handle initial socket connection to Sails
			socket.on('connect', function() {

				prepModels(function(err) {
					if (err) {return cb(err);}
					var projectID = sails.config.shipyard.src.projectId;
					socket.get(sails.config.shipyard.src.baseURL + '/project/subscribe/'+projectID+'?secret='+sails.config.shipyard.src.secret);

					reloadAllModels(function(err) {
						if (err) {return cb(err);}
						// Handle model pubsub messages from Sails
						socket.on('model', handleModelMessage);
						socket.on('project', handleProjectMessage);
						return cb();
					});
				});
					
			});

		},

		clean: clean

	};

	function clean(cb, options) {

		if (options && options.forceSync) {return cb();}

		glob(path.join(process.cwd(), 'api/models/*.attributes.json'), function(err, files) {
			async.forEach(files, fs.unlink, cb);
		});

	}

	/**
	 * Send local models up to Shipyard
	 * @param  {Function} cb callback
	 */
	function prepModels(cb) {

		if (Object.keys(sails.models).length === 0) {return cb();}
		var waterlineSchema = sails.models[Object.keys(sails.models)[0]].waterline.schema;
		var projectID = sails.config.shipyard.src.projectId;
		var modelDefs = [];
		Object.keys(sails.models).forEach(function(key) {
			if (waterlineSchema[key].junctionTable === true) return;
			var attributes = _.omit(sails.models[key].attributes, ['createdAt', 'updatedAt', 'id']);
			modelDefs.push({globalId: sails.models[key].globalId, attributes: attributes, project: projectID});
		});
		// Post the model to Shipyard.  If it already exists, we'll get a 409 status, which we can ignore.
		socket.post(sails.config.shipyard.src.baseURL + '/'+projectID+'/modules/models/?secret='+sails.config.shipyard.src.secret, modelDefs, function(data) {

			if (data.status && data.status != 200) {
				return cb(data);
			}

			// Otherwise we're okay
			return cb();

		});
	}

	function stop() {
		sails.log.verbose("Yarr WATCH stopped.");
	}



	function handleModelMessage(message) {

		// Handle model updates
		if (message.verb == 'updated') {

			reloadAllModels();
		}

	}

	function handleProjectMessage(message) {

		// Handle model updates
		if (message.verb == 'messaged') {

			reloadAllModels();

		}

	}

	function reloadAllModels(cb) {

		cb = cb || function(){};
		
		// Get all the current models for the linked project,
		// and subscribe to changes to those models
		socket.get(sails.config.shipyard.src.url + '/models?secret='+sails.config.shipyard.src.secret, function (models) {

			clean(function() {

				// Write the models to the local project filesystem
				writeModels(models, function(err) {
					
					return cb(err);

				});


			});

		});

	}

	function writeModels(models, cb) {

		async.forEach(Object.keys(models), function(globalId, cb) {

			// Make JSON out of model def
			var identity = models[globalId].identity;
			var model = {attributes: models[globalId].attributes, globalId: globalId, identity: identity};

			// Clear out any examples in the attributes
			Object.keys(model.attributes).forEach(function(attribute_name) {
				var attribute = model.attributes[attribute_name];
				delete attribute.example;
				delete attribute.description;
				delete attribute.validations;
				// If the attribute is malformed--like a collection without a via--just set the type to "string"
				if ((!attribute.type && !attribute.model && !attribute.collection) || (attribute.collection && !attribute.via)) {
					attribute.type = 'string';
					delete attribute.collection;
				}
				// Loop through any validations and weed out malformed ones
				attribute.validations = _.reduce(attribute.validations, function(memo, validation) {
					if (!(validation.value === null || validation.value === '')) {
						memo.push(validation);
					}
					return memo;
				}, []);
			});

			var json = JSON.stringify(model);

			// Write the model's attributes to a JSON file
			
			fs.writeFile(path.join(process.cwd(), 'api/models/', globalId+'.attributes.json'), json, function(err) {

				if (err) {throw new Error(err);}
				// See if a controller exists for this model
				if (sails.controllers[identity]) {
					// If so, we can return now
					return cb();
				}
				// Otherwise create one so we can use blueprints
				fs.writeFile(path.join(process.cwd(), 'api/controllers/', globalId+'Controller.js'), "module.exports = {};", function(err) {
					if (err) {throw new Error(err);}
					cb();
				});

			});

		}, function() {

			// Reload controller middleware
			sails.hooks.controllers.loadAndRegisterControllers(function() {

				sails.once('hook:orm:reloaded', function() {
	
					// Flush router
					sails.router.flush();
					// Reload blueprints
					sails.hooks.blueprints.bindShadowRoutes();

					return cb();

				});

				// Reload ORM
				sails.emit('hook:orm:reload');

			});

		});

	}

};