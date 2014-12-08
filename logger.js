/**
 * Module dependencies.
 */

var util = require('util');

// Give it some Marak juice.
require('colors');


// Log level configuration is just a dumb constant at the moment
var IS_VERBOSE = true;


module.exports = (function ( ) {

	function noop () {}

	// Returns a configured log function using closure arg
	function _logFactory ( color ) {

		// Private generic log fn
		// Basically just a colorized version of console.log()
		return function _log ( /* things to log */ ) {
			var args = Array.prototype.slice.call(arguments);
			for (var i = 0; i < args.length; i++) {
				if (color && args[i]) {
					// Use util.inspect on non-strings
					if (typeof args[i] !== 'string') {
						args[i] = util.inspect(args[i]);
					}
					args[i] = args[i][color];
				}
			}
			console.log.apply(console, args);
		};
	}


	var log = _logFactory();
	log.error = _logFactory('red');
	log.verbose = IS_VERBOSE ? _logFactory('magenta') : noop;

	log.hr = function() {
		_logFactory();
		_logFactory('--'.grey);
	};

	return log;
})();
