/**
 * 404 injection hook
 */

var path = require('path');
var _ = require('lodash');

module.exports = function(options) {

  if(!options) {
    options = {};
  }

  var projectId = options.projectId;
  var shipyardUrl = options.url;

  return function(sails) {
    return {
      routes: {

        after: {

          'all /*': function fourOhFour (req, res) {
            var _inputs = _.merge({}, req.body, req.query);
            var url = req.url.split('?')[0];

            // Build out input objects
            var inputs = _.reduce(_inputs, function(memo, example, key) {
              memo[key] = {
                example: example
              };

              return memo;
            }, {});

            try {
              var yarrLocal = {
                shipyardUrl: shipyardUrl + '/api/v1/projects/createRoute',
                data: {
                  project: projectId,
                  inputs: inputs,
                  url: url
                }
              };

              var dir = path.resolve(__dirname, '../../assets/404');
              res.view(dir, { layout: false, locals: { data: JSON.stringify(yarrLocal) }});
            }
            catch(err) {
              res.serverError(err);
            }
          }

        }
      }
    };
  };
};
