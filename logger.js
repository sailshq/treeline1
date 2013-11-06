/**
 * Module dependencies.
 */

var util = require('util');

// Give it some Marak juice.
require('colors');


module.exports = (function () {

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
	log.verbose = _logFactory('grey');

	return log;
})();