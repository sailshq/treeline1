/**
 * Run the linked Sails app
 */

var Sails = require('sails/lib/app');
var express = require('sails/node_modules/express');
var _ = require('lodash');
var rc = require('rc');
var path = require('path');
var buildDictionary = require('sails-build-dictionary');
var log = require('../../logger');
var watcher = require('../../watch');
var fourOhFourHook = require('../hooks/404');
var maintenanceHook = require('../hooks/maintenance');

module.exports = function runApp (conf, args, cb) {

  if (conf.runningApp) return cb('Preview server is already running!');

  var projectName = (conf.targetProject.fullName).cyan;

  log();
  log('Running ' + projectName + '...');

  log.hr();
  log('Preview server is warming up...'.yellow);
  log('(hit <CTRL+C> to cancel at any time)');
  log();

  var delayedLog = function (ms) {
    return function logFn () {
      var args = Array.prototype.slice.call(arguments);
      delayedLog.timers.push(setTimeout(function () {
        log.apply(log,args);
      }, ms || 300));
    };
  };

  delayedLog.timers = [];

  delayedLog(50)('Synchronizing app with Treeline...'.grey);
  delayedLog(450)('Calibrating machines...'.grey);
  delayedLog(2500)('Hold tight, this can take a moment...'.yellow);

  // Give up after 30 seconds
  delayedLog.timers.push(setTimeout(function () {
    log.error('The preview server isn\'t starting...');
    log.error('Please try again later.  If the problem persists, check @treelineio for updates.');
    for (var i in delayedLog.timers) {
      clearTimeout(delayedLog.timers[i]);
    }
    return;
  }, 30000));


  var sails = new Sails();
  var watch = watcher(sails);
  var treelineConfig = {
    src: {
      secret: conf.credentials.secret,
      baseURL: conf.config.treelineURL,
      url: conf.config.treelineURL + '/' + conf.targetProject.id + '/modules',
      projectId: conf.targetProject.id,
      protocol: 'http://',
      host: 'api.treeline.io',
      port: 80,
      prefix: '',
      endpoint: '/modules'
    }
  };

  var options = conf.targetProject.options || {};
  _.defaults(options, {
    forceSync: args[0].forceSync,
    modelsOnly: args[0].modelsOnly,
    export: !args[0].plugin
  });

  var liftOptions = {
    models: {
      migrate: 'alter'
    },
    treeline: treelineConfig
  };


  //////////////////////////////////
  // 404 injection
  liftOptions.hooks = {
    fourOhFour: fourOhFourHook({
      url: conf.config.treelineURL,
      projectId: conf.targetProject.id,
      xAuth: conf.credentials.secret
    }),
    maintenance: maintenanceHook
  };
  //////////////////////////////////


  // Load the app's local .sailsrc
  var localSailsRc = rc('sails', {}, ["--config", path.join(process.cwd(), '.sailsrc')]);

  // Delete keys that `rc` puts in that we don't want
  delete localSailsRc[0];
  delete localSailsRc[1];
  delete localSailsRc.config;

  // Merge our lift options
  _.extend(liftOptions, localSailsRc);

  // Make sure the Treeline plugin is listed
  liftOptions.plugins = liftOptions.plugins || {treeline: true};
  liftOptions.plugins.treeline = liftOptions.plugins.treeline || true;

  liftOptions.moduleLoaderOverride = function(sails, orig) {
    var loadUserConfig = orig.loadUserConfig;

    return {
      loadUserConfig: function(cb) {
        buildDictionary.aggregate({
          dirname   : sails.config.appPath + "/node_modules/treeline/config/",
          exclude   : ['locales', 'local.js', 'local.json', 'local.coffee'],
          excludeDirs: /(locales|env)$/,
          filter    : /(.+)\.(js|json|coffee)$/,
          identity  : false
        }, function (err, treelineConfigs) {
          loadUserConfig(function(err, userConfigs) {
            if (err) {return cb(err);}
            cb(null, sails.util.merge(treelineConfigs, userConfigs));
          });
        });
      },

      /**
       * Load app controllers
       *
       * @param {Object} options
       * @param {Function} cb
       */
      loadControllers: function(cb) {
        loadApiWithPlugins(function loader (dirName, cb) {
          buildDictionary.optional({
            dirname: dirName,
            filter: /(.+)Controller\.(js|coffee)$/,
            flattenDirectories: true,
            keepDirectoryPath: true,
            replaceExpr: /Controller/
          }, cb);
        }, "controllers", cb);
      },

      loadResponses: function(cb) {
        loadApiWithPlugins(function loader (dirName, cb) {
          buildDictionary.optional({
            dirname     : dirName,
            filter: /(.+)\.(js|coffee|litcoffee)$/,
            useGlobalIdForKeyName: true
          }, cb);
        }, "responses", cb);
      },


      /**
       * Load app's model definitions
       *
       * @param {Object} options
       * @param {Function} cb
       */
      loadModels: function (cb) {
        loadApiWithPlugins(function loader (dirName, cb) {
          // Get the main model files
          buildDictionary.optional({
            dirname   : dirName,
            filter    : /^([^.]+)\.(js|coffee)$/,
            replaceExpr : /^.*\//,
            flattenDirectories: true
          }, function(err, models) {
            if (err) {return cb(err);}
            // Get any supplemental files
            buildDictionary.optional({
              dirname   : dirName,
              filter    : /(.+)\.attributes.json$/,
              replaceExpr : /^.*\//,
              flattenDirectories: true
            }, function(err, supplements) {
              if (err) {return cb(err);}
              return cb(null, sails.util.merge(models, supplements));
            });
          });
        }, "models", cb);
      },

      /**
       * Load app services
       *
       * @param {Object} options
       * @param {Function} cb
       */
      loadServices: function (cb) {
        loadApiWithPlugins (function loader(dirName, cb) {
          buildDictionary.optional({
            dirname     : dirName,
            filter      : /(.+)\.(js|coffee)$/,
            depth     : 1,
            caseSensitive : true
          }, cb);
        }, "services", cb);
      }
    };
  };

  liftOptions.http = {
    middleware: {
      www: (function() {
        var pub = path.resolve(process.cwd(), '.tmp/public');
        var flatFileMiddleware = express['static'](pub);

        return function (req, res, next) {
          var pub = path.resolve(__dirname, '../../assets');
          var treelineStatic = express['static'](pub);
          treelineStatic(req, res, function (err) {
            if (err) return next(err);
            return flatFileMiddleware(req, res, next);
          });
        };
      })(),
    }
  };

  // Start watching for changes from Treeline
  watch.start(treelineConfig, options, function() {

    // Start sails and pass it command line arguments
    sails.lift(liftOptions, function (err) {

      if (err) return cb(err);

      // Clear obnoxious timers
      for (var i in delayedLog.timers) {
        clearTimeout(delayedLog.timers[i]);
      }

      // Keep track of running app
      conf.runningApp = sails;
    });

  });

  function loadApiWithPlugins(loader, api, cb) {
    async.auto({
      plugins: function(cb) {
        async.map(_.keys(sails.config.plugins), function(plugin, cb) {loader(sails.config.appPath + "/node_modules/" + plugin + "/api/" + api, cb);}, cb);
      },
      local: function(cb){loader(sails.config.paths[api], cb);}
    }, function (err, async) {
      if (err) {return cb(err);}
      return cb(null, _.extend(_.merge.apply(this, async.plugins), async.local));
    });
  }

};
