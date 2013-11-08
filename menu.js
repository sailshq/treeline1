/**
 * Module dependencies.
 */

var program = require('commander'),
	prompt = require('prompt');

// Configure logger
//
var log = require('./logger');

/**
 * Extend the specified object with CLI utility methods
 *
 * @param victim - the object to monkeypatch
 */
module.exports = function (victim) {

	/**
	 * Require the user to make a choice from a set of options.
	 */
	victim.chooseFromMenu = function ( msg, choices, exits ) {

		// Default exits
		exits = exits || {};
		
		// TODO: use `prompt` to take care of this validation for us.
		// If no `unrecognized` exit is defined, use this default behavior
		// exits['_unrecognized'] = function defaultUnrecognizedExit (choice) {
		// 	log.error('Invalid choice. ('+choice+')');
		// };

		// If no `err` exit defined, use this default behavior
		//
		if (!exits.err) exits.err = function defaultPromptError (err) {
			
			// Prompt sends back 'canceled' as an error if the user hits [^C]
			// But that's ok, we'll allow the user to cancel.
			//
			if ( err && err.toString && err.toString().match(/canceled/) ) {
				console.log();
				process.exit(0);
			}

			throw err;
		};

		// Display the menu prompt msg
		//
		log ();
		log (msg);


		// Display the menu choices
		//
		for (var _i in choices) {
			log( (+(_i)+1) + '. ' + choices[_i] );
		}

		// Start the prompt
		//
		prompt.start();
		prompt.get({
			properties: {
				choice: { description: ' ' }
			}
		}, function(err, result) {
			if (err) return exits.err(err);

			// Determine the choice that was made
			var choseIndex = result.choice - 1;
			var choice = choices[choseIndex];
			var chosenExit = exits[choice];

			// If choice is not handled in CLI code,
			// use the wildcard exit, '*'
			if (!chosenExit) return exits['*'](choice, choseIndex);
			
			exits[choice](choice, choseIndex);
		});


	};


	// Return modified victim
	return victim;

};
