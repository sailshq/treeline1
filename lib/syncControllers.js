var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var async = require('async');
var log = require('../logger');
var _ = require('lodash');
var beautify = require('js-beautify').js_beautify;

module.exports = function(sails, socket) {

	return {

		reloadAllControllers: function (config, options, cb) {

			var self = this;
			cb = cb || function(){};
			options = options || {};
			config = config || sails.config.shipyard;
			options.config = config;

			socket.get(config.src.url + '/controllers?secret='+config.src.secret, function(data) {

				// clean(function(err) {
					// if (err) {return cb(err);}
					self.writeControllers(data.controllers, function(err) {
						if (err) {return cb(err);}
						self.writeRoutes(data.routes, cb);
					});
				// });

			});

		},

		writeControllers: function (controllers, cb) {

			cb = cb || new Function();

			// Loop through each of the services we got from Shipyard
			async.forEach(Object.keys(controllers), function(controllerName, cb) {

				var code = controllers[controllerName];

				// Write the model's attributes to a JSON file
				fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), '/api/controllers/', controllerName+'.js'), code, cb);

			}, cb);

		},

		writeRoutes: function (routes, cb) {
			var routeConfigs = {};
			routes.forEach(function(route) {
				routeConfigs[route.method + ' ' + route.path] = route.target;
			});
			var output = beautify("module.exports.routes = " + JSON.stringify(routeConfigs) + ";", {indent_size: 2});
			fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/yarr/'), '/config/routes.js'), output, cb);

		}

	};

};

/**
 * Wipe out all controller files
 * @param  {Function} cb      [description]
 * @param  {[type]}   options [description]
 * @return {[type]}           [description]
 */
function clean(cb) {
	return cb();
	glob(path.join(process.cwd(), 'node_modules/yarr/api/controllers/*.*'), function(err, files) {
		async.forEach(files, fs.unlink, cb);
	});

}
