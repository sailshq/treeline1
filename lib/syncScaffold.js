var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var async = require('async');
var log = require('../logger');
var _ = require('lodash');
var beautify = require('js-beautify').js_beautify;

module.exports = function(sails, socket) {

  return {

    createResponse: function (config, options, cb) {

      var self = this;
      cb = cb || function(){};
      options = options || {};
      config = config || sails.config.treeline;
      options.config = config;

      var response = fs.readFileSync(path.resolve(__dirname, "response.js"));

      // Write the model's attributes to a JSON file
      fs.outputFile(path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), '/api/responses/response.js'), response, cb);

    }

  };

};
