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
				clean(function(err) {
					if (err) {return cb(err);}
					self.writeServices(services, cb);
				});
			});

		},

		writeServices: function (services, cb) {

			cb = cb || new Function();

			// Loop through each of the services we got from Shipyard
			async.forEach(Object.keys(services), function(serviceName, cb) {

				async.auto({

					// Write out the service Javascript file
					writeService: function(cb) {
						var code = services[serviceName].code;

						// Write the model's attributes to a JSON file
						fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), 'api/services/', serviceName+'Service.js'), code, cb);
					},
					// Write out the service's dependency indexes
					writeDependencies: function(cb) {
						async.each(Object.keys(services[serviceName].depFiles), function(filePath, cb) {
							fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), "api/services/node_modules/", filePath, "index.js"), services[serviceName].depFiles[filePath].code, cb);
						}, cb);
					},
					// Create node_modules folders to hold dependencies
					writeDirectories: ['writeDependencies', function(cb) {
						async.each(Object.keys(services[serviceName].depFiles), function(filePath, cb) {
							fs.mkdir(path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), "api/services/node_modules/", filePath, "node_modules"), cb);
						}, cb);
					}],
					// Install dependencies as necessary
					installDependencies: ['writeDependencies', 'writeDirectories', function(cb) {
						async.each(Object.keys(services[serviceName].depFiles), function(filePath, cb) {
							async.each(services[serviceName].depFiles[filePath].dependencies, function(dependency, cb) {
								dependency = dependency.split(":");
								var name = dependency[0];
								var ver = dependency[1] || '*';
								exec("npm install "+name+"@"+ver, {cwd: path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), "api/services/node_modules/", filePath)}, cb);
							}, cb);
						}, cb);
					}]
				}, cb);

			}, cb);

		}

	};

};

function clean(cb) {

	glob(path.join(process.cwd(), 'node_modules/yarr/api/services/*.*'), function(err, files) {
		async.forEach(files, fs.unlink, cb);
	});

}
