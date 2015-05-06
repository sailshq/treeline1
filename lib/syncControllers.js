var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var async = require('async');
var log = require('../logger');
var debug = require('debug')('treeline');
var _ = require('lodash');
var beautify = require('js-beautify').js_beautify;
var pathToRegexp = require('path-to-regexp');


module.exports = function(sails, socket) {

  return {

    reloadAllControllers: function (config, options, cb) {

      var self = this;
      cb = cb || function(){};
      options = options || {};
      config = config || sails.config.treelineCli;
      options.config = config;

      debug('hitting %s to reload controllers...',config.src.url + '/controllers?secret='+config.src.secret);
      socket.get(config.src.url + '/controllers?secret='+config.src.secret, function(data, jwr) {
        debug('got:',jwr);
        if (jwr.statusCode !== 200) {return cb(jwr.body);}
        clean(options, function(err) {
          if (err) {return cb(err);}
          if (!data) {
            return cb(new Error('Could not fetch controllers from Treeline. Please try again later.'));
          }
          self.writeControllers(data.controllers, function(err) {
            if (err) {return cb(err);}
            self.writeRoutes(data.routes, cb);
          });
        });

      });

    },

    writeControllers: function (controllers, cb) {

      cb = cb || new Function();

      // Loop through each of the services we got from Treeline
      async.forEach(_.keys(controllers), function(controllerName, cb) {

        var code = controllers[controllerName];

        // Write the model's attributes to a JSON file
        fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), '/api/controllers/', controllerName+'.js'), code, cb);

      }, cb);

    },

    writeRoutes: function (routes, cb) {
      var routeConfigs = {};

      if (!_.isArray(routes)){
        routes = [];
      }

      // Sort routes in order to establish precedence
      // (eliminates dependency on key order and avoids issues w/ wildcards)
      routes.sort(function(routeA, routeB) {
        var routeParams = [];
        var regexpA = pathToRegexp(routeA.path, routeParams);

        // If routeA has any dynamic route params, toss it to the
        // bottom of the list.
        if (routeParams.length) {
          return 1;
        }
        else return -1;
      });

      routes.forEach(function(route) {
        routeConfigs[route.method + ' ' + route.path] = {target: route.target};
        // If a path contains a wildcard, add "skipAssets" flag to the binding so that it doesn't match assets
        if (route.path.indexOf(':') > -1) {routeConfigs[route.method + ' ' + route.path].skipAssets = true;}
      });

      var output = beautify("module.exports.routes = " + JSON.stringify(routeConfigs) + ";", {indent_size: 2});
      fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), '/config/routes.js'), output, cb);
      // Reset sails.config.routes to the new routes
      if (sails && sails.config) {
        sails.config.routes = routeConfigs;
      }
    }

  };

};

/**
 * Wipe out all controller files
 * @param  {Function} cb      [description]
 * @param  {[type]}   options [description]
 * @return {[type]}           [description]
 */
function clean(options, cb) {
  // return cb();
  glob(path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), '/api/controllers/*.*'), function(err, files) {
    async.forEach(files, fs.remove, cb);
  });

}
