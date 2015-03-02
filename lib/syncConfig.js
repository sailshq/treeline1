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

    reloadAllConfig: function (config, options, cb) {

      var self = this;
      cb = cb || function(){};
      options = options || {};
      config = config || sails.config.treeline;
      options.config = config;

      debug('hitting %s to reload config...',config.src.url + '/config?secret='+config.src.secret);
      socket.get(config.src.url + '/config?secret='+config.src.secret, function(data, jwr) {
        debug('got:',data, jwr);
        clean(options, function(err) {
          if (err) {return cb(err);}
          if (!data) {
            return cb(new Error('Could not fetch config from Treeline. Please try again later.'));
          }
          var output = "module.exports = {";
          output += "machines: {installDependencies: true, _hookTimeout: 120000},";
          if (data.projectConfigVars) {
            output += "treeline: " + JSON.stringify(data.projectConfigVars);
          }
          output += "};";
          output = beautify(output, {indent_size: 2});
          fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), '/config/treeline.js'), output, cb);

        });

      });

    },

  };

};


/**
 * Wipe out config file
 * @param  {Function} cb      [description]
 * @param  {[type]}   options [description]
 * @return {[type]}           [description]
 */
function clean(options, cb) {
  // return cb();
  glob(path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), '/config/treeline.js'), function(err, files) {
    async.forEach(files, fs.remove, cb);
  });

}
