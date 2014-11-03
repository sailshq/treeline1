/**
 * Run the linked Sails app
 */

var Sails = require('sails/lib/app');
var _ = require('lodash');
var rc = require('rc');
var path = require('path');
var buildDictionary = require('sails-build-dictionary');
var log = require('../../logger');
var watcher = require('../../watch');

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

  delayedLog(50)('Synchronizing app with Shipyard...'.grey);
  delayedLog(450)('Calibrating machines...'.grey);
  delayedLog(2500)('Hold tight, this can take a moment...'.yellow);

  // Give up after 30 seconds
  delayedLog.timers.push(setTimeout(function () {
    log.error('The preview server isn\'t starting...');
    log.error('Please try again later.  If the problem persists, check @shipyardio for updates.');
    for (var i in delayedLog.timers) {
      clearTimeout(delayedLog.timers[i]);
    }
    return;
  }, 30000));


  var sails = new Sails();
  var watch = watcher(sails);
  var shipyardConfig = {
    src: {
      secret: conf.credentials.secret,
      baseURL: conf.config.shipyardURL,
      url: conf.config.shipyardURL + '/' + conf.targetProject.id + '/modules',
      projectId: conf.targetProject.id,
      protocol: 'http://',
      host: 'localhost',
      port: 4444,
      prefix: '',
      endpoint: '/modules'
    }
  };

  var options = conf.targetProject.options || {};
  _.defaults(options, {
    forceSync: args[0].forceSync,
    modelsOnly: args[0].modelsOnly,
    export: args[0].export
  });

  var liftOptions = {
    models: {
      migrate: 'alter'
    },
    shipyard: shipyardConfig
  };

  // Load the app's local .sailsrc
  var localSailsRc = rc('sails', {}, ["--config", path.join(process.cwd(), '.sailsrc')]);

  // Delete keys that `rc` puts in that we don't want
  delete localSailsRc[0];
  delete localSailsRc[1];
  delete localSailsRc.config;

  // Merge our lift options
  _.extend(liftOptions, localSailsRc);

  // Make sure the Yarr plugin is listed
  liftOptions.plugins = liftOptions.plugins || {yarr: true};
  liftOptions.plugins.yarr = liftOptions.plugins.yarr || true;

  liftOptions.moduleLoaderOverride = function(sails, orig) {
    var loadUserConfig = orig.loadUserConfig;

    return {
      loadUserConfig: function(cb) {
        buildDictionary.aggregate({
          dirname   : sails.config.appPath + "/node_modules/yarr/config/",
          exclude   : ['locales', 'local.js', 'local.json', 'local.coffee'],
          excludeDirs: /(locales|env)$/,
          filter    : /(.+)\.(js|json|coffee)$/,
          identity  : false
        }, function (err, yarrConfigs) {
          loadUserConfig(function(err, userConfigs) {
            if (err) {return cb(err);}
            cb(null, sails.util.merge(yarrConfigs, userConfigs));
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

  // Start watching for changes from Shipyard
  watch.start(shipyardConfig, options, function() {

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
        async.map(Object.keys(sails.config.plugins), function(plugin, cb) {loader(sails.config.appPath + "/node_modules/" + plugin + "/api/" + api, cb);}, cb);
      },
      local: function(cb){loader(sails.config.paths[api], cb);}
    }, function (err, async) {
      if (err) {return cb(err);}
      return cb(null, _.extend(_.merge.apply(this, async.plugins), async.local));
    });
  }

};
