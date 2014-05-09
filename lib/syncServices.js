var path = require('path');
var fs = require('fs');
var glob = require('glob');
var async = require('async');
var log = require('../logger');
var _ = require('lodash');

module.exports = function(sails, socket) {

	return {

		reloadAllServices: function (config, options, cb) {

			var self = this;
			cb = cb || function(){};
			options = options || {};
			config = config || sails.config.shipyard;
			options.config = config;

			socket.get(config.src.url + '/services?secret='+config.src.secret, function(services) {
				self.writeServices(services, cb);

			});

		},

		writeServices: function (services, cb) {

			cb = cb || new Function();

			// Loop through each of the services we got from Shipyard
			async.forEach(Object.keys(services), function(serviceName, cb) {

				var code = services[serviceName];

				// Write the model's attributes to a JSON file
				fs.writeFile(path.join(process.cwd(), 'api/services/', serviceName+'Service.js'), code, cb);

			}, cb);

		}

	}

}
