var _ioClient = require('./sails.io')(require('socket.io-client'));
var path = require('path');
var fs = require('fs');
module.exports = function(sails) {

	// Get the Shipyard URL
	var src = sails.config.shipyard.src;
	var baseURL = src.protocol + src.host + ':' + (src.port +'');

	// Get the socket.io client connection
	var socket = _ioClient.connect(baseURL);

	return {
		start: function(cb) {

			cb = cb || function(){};
			sails.log.verbose("Yarr WATCH started.");

			// Handle model pubsub messages from Sails
			socket.on('model', handleModelMessage);
			socket.on('project', handleProjectMessage);

			// When Sails lowers, stop watching
			sails.on('lower', stop);

			// Handle initial socket connection to Sails
			socket.on('connect', function() {

				prepModels(function(err) {
					if (err) {return cb(err);}
					var projectID = sails.config.shipyard.src.projectId;
					socket.get(baseURL + '/project/subscribe/'+projectID+'?secret='+sails.config.shipyard.src.secret);
					reloadAllModels(cb);
				});
					
			});

		}

	};

	/**
	 * Send local models up to Shipyard
	 * @param  {Function} cb callback
	 */
	function prepModels(cb) {
		var waterlineSchema = sails.models[Object.keys(sails.models)[0]].waterline.schema;
		var projectID = sails.config.shipyard.src.projectId;
		async.each(Object.keys(sails.models), function(key, cb) {
			// Don't send join tables
			if (waterlineSchema[key].junctionTable === true) return cb();
			var identity = sails.models[key].identity;
			var attributes = _.omit(sails.models[key].attributes, ['createdAt', 'updatedAt', 'id']);
			// Post the model to Shipyard.  If it already exists, we'll get a 409 status, which we can ignore.
			socket.post(baseURL + '/'+projectID+'/modules/models/?secret='+sails.config.shipyard.src.secret, {globalId: identity, attributes: attributes}, function(data) {
				// If we get a status that isn't 200 or 409, bail
				if (data.status && data.status != 409 && data.status != 200) {
					return cb(data);
				}
				// Otherwise we're okay
				return cb();
			});
		}, cb);
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

		// Get all the current models for the linked project,
		// and subscribe to changes to those models
		socket.get(sails.config.shipyard.src.url + '/models?secret='+sails.config.shipyard.src.secret, function (models) {

			// Write the models to the local project filesystem
			writeModels(models, function(err) {
				
				return cb(err);

			});


		});

	}

	function writeModels(models, cb) {

		async.forEach(Object.keys(models), function(key, cb) {

			// Make JSON out of model def
			var identity = models[key].identity;
			var model = {attributes: models[key].attributes};
			var json = JSON.stringify(model);

			// Write the model's attributes to a JSON file
			
			fs.writeFile(path.join(process.cwd(), 'api/models/', identity+'.attributes.json'), json, function(err) {

				if (err) {throw new Error(err);}
				// See if a controller exists for this model
				if (sails.controllers[identity]) {
					// If so, we can return now
					return cb();
				}
				// Otherwise create one so we can use blueprints
				fs.writeFile(path.join(process.cwd(), 'api/controllers/', identity+'Controller.js'), "module.exports = {};", function(err) {
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