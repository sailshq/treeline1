/**
 * Module dependencies
 */
var http = require('request'),
	util = require('sails/node_modules/sails-util'),
	log = require('./logger');


/**
 * Fetch and parse JSON data from Treeline
 *
 * @api private
 */
module.exports = {
	login: function (options, cb) {
		return _fetch({
			url: options.baseURL + '/cli/login',
			method: 'put',
			json: options.params
		}, cb);
	},
	getApps: function (options, cb) {
		return _fetch({
			url: options.baseURL + '/cli/apps',
			method: 'get',
			qs: {
				secret: options.secret
			}
			// TODO: add this back in - requires socket interpreter work.
			// headers: {
			// 	'x-auth-treeline': options.secret
			// }
		}, cb);
	},
	createNewApp: function (options, cb) {

		return _fetch({
			url: options.baseURL + '/api/v1/projects',
			method: 'post',
      headers: {
       'x-auth': options.secret
      },
			json: options.params
		}, cb);
	}
};






function _fetch (options, cb) {

	http(options,
	function gotResponse (err, resp, body) {
		if (err || !body) {
			log.error();
			log.error('Error communicating with Treeline!');
			log.error('Please make sure you are connected to the internet.');
			log.error();
			return cb(err, body);
		}

		// Treeline responded with an error:');
		// HTTP Status === resp.statusCode
		if (resp.statusCode < 200 || resp.statusCode > 300) {

			// Attempt to parse body as JSON
			var parsedErr;
			if (typeof body === 'string') {
				try {
					parsedErr = JSON.parse(body);

				}
				catch (e) {}
			}
			return cb(parsedErr || body);
		}

		// If response is a string, it must be JSON (or there's a problem)
		// Let's make it into an object.
		if (typeof body === 'string') {
			try {
				body = JSON.parse(body);
			}
			catch (e) {
				log.error('Error parsing JSON response from Treeline ::','\n',body,'\n\n');
				return cb(e);
			}
		}

		// Successfully parsed response from Treeline
		return cb(null, body);
	});
}
