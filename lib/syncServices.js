var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var async = require('async');
var log = require('../logger');
var _ = require('lodash');
var exec = require('child_process').exec;

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

				async.auto({

					writeService: function(cb) {
						var code = services[serviceName].code;

						// Write the model's attributes to a JSON file
						fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), 'api/services/', serviceName+'Service.js'), code, cb);
					},
					writeDependencies: function(cb) {
						async.each(Object.keys(services[serviceName].depFiles), function(filePath, cb) {
							fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), "api/services/node_modules/", filePath, "index.js"), services[serviceName].depFiles[filePath].code, cb);
						}, cb);
					},
					writeDirectories: function(cb) {
						async.each(Object.keys(services[serviceName].depFiles), function(filePath, cb) {
							fs.mkdir(path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), "api/services/node_modules/", filePath, "node_modules"), cb);
						}, cb);
					},
					installDependencies: ['writeDependencies', 'writeDirectories', function(cb) {
						async.each(Object.keys(services[serviceName].depFiles), function(filePath, cb) {
							async.each(services[serviceName].depFiles[filePath].dependencies, function(dependency, cb) {
								dependency = dependency.split(":");
								var name = dependency[0];
								var ver = dependency[1] || '*';
								var cwd = process.cwd();
								exec("npm install "+name+"@"+ver, {cwd: path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), "api/services/node_modules/", filePath)}, cb);
							}, cb);
						}, cb);
					}]
				}, cb);

			}, cb);

		}

	};

};
