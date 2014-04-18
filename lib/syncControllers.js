var path = require('path');
var fs = require('fs');
var glob = require('glob');
var async = require('async');
var log = require('../logger');
var _ = require('lodash');

module.exports = function(sails, socket) {

	return {

		reloadAllControllers: function (config, options, cb) {

			var self = this;
			cb = cb || function(){};
			options = options || {};
			config = config || sails.config.shipyard;
			options.config = config;
			
			socket.get(config.src.url + '/controllers?secret='+config.src.secret, function(controllers) {

				self.writeControllers(controllers, cb);

			});

		},

		writeControllers: function (controllers, cb) {

			cb = cb || new Function();

			// Loop through each of the services we got from Shipyard
			async.forEach(Object.keys(controllers), function(controllerName, cb) {

				var code = controllers[controllerName];

				// Write the model's attributes to a JSON file
				fs.writeFile(path.join(process.cwd(), 'api/controllers/', controllerName+'.js'), code, cb);

			}, cb);

		}

	}

}
