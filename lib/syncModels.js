var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var async = require('async');
var log = require('../logger');
var buildDictionary = require('sails-build-dictionary');
var _ = require('lodash');
var beautify = require('js-beautify').js_beautify;
var debug = require('debug')('treeline');

module.exports = function(sails, socket) {

	return {

		reloadAllModels: function (config, options, cb) {

			if (typeof config == 'function') {
				cb = config;
				config = null;
				options = null;
			}

			var self = this;
			cb = cb || function(){};
			options = options || {};
			config = config || sails.config.treelineCli;
			options.config = config;

      socket.get(config.src.url + '/models?secret='+config.src.secret, function(models, jwr) {
        debug('got:',jwr);
        if (jwr.statusCode !== 200) {return cb(jwr.body);}
        clean(options, function(err) {
          if (err) {return cb(err);}
          if (!models) {
            return cb(new Error('Could not fetch models from Treeline. Please try again later.'));
          }
          self.writeModels(models, options, cb);
        });

      });

		},

		writeModels: function (models, options, cb) {

			cb = cb || new Function();
			options = options || {};
			var config = options.config || sails.config.treelineCli;

			async.auto({

				// Load the list of top-level controller files
				controllers: function(cb) {
					fs.readdir(path.resolve(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), 'api/controllers'), function(err, files) {
						if (err) {
              if (err.code == 'ENOENT') {
                return cb(null, []);
              }
              return cb(err);
            }
						cb(null, files.map(function(file) {return file.toLowerCase();}));
					});
				},

				writeToDisk: ['controllers', function(cb, results) {

					// Loop through each of the models we got from Treeline (or created in response to finding a new user model)
					async.forEach(_.keys(models), function(globalId, cb) {
						// Make JSON out of model def
						var identity = models[globalId].identity || globalId.toLowerCase();
						var model = {attributes: models[globalId].attributes, globalId: globalId, identity: identity};
						var json = JSON.stringify(model);
						if (options.beautifyModels) {
							json = beautify(json, {indent_size: 2});
						}
						// Write the model's attributes to a JSON file
						fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), '/api/models/', globalId+'.attributes.json'), json, function(err) {

							if (err) {throw new Error(err);}
							// See if a controller exists for this model
							if (results.controllers.indexOf(identity+'controller.js') !== -1) {
								// If so, we can return now
								return cb();
							}
							// Otherwise create one so we can use blueprints
							fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), '/api/controllers/', globalId+'Controller.js'), "module.exports = {};", function(err) {
								if (err) {throw new Error(err);}
								cb();
							});

						});

					}, cb);

				}]

			}, cb);


		}


	};

};

/**
 * Wipe out all model .json files
 * @param  {Function} cb      [description]
 * @param  {[type]}   options [description]
 * @return {[type]}           [description]
 */
function clean(options, cb) {

	glob(path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), '/api/models/*.*'), function(err, files) {
		async.forEach(files, fs.remove, cb);
	});

}
