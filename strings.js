/**
 * Stringfile
 */




var STRINGS = {
	
	NO_APPS_AVAILABLE:
	'Looks like you don\'t have access to any apps.',

	CHOOSE_APP_TO_LIFT:
	' ::::::::::::::::::::::::::::::::::::::::::::::::::::::'+'\n'+
	' :::: Choose One of Your Projects :::::::::::::::::::::'+'\n'+
	' ::::::::::::::::::::::::::::::::::::::::::::::::::::::'
	//'   ' + '(or hit <CTRL+C> to cancel)'.grey



};



// Allow __() to be called, traditional-i18n style.
module.exports = function (key) {
	return STRINGS[key];
};
// Also expose string constants directly on exports
var stringKeys = Object.keys(STRINGS);
for (var i = 0; i < stringKeys.length; i++ ) {
	var key = stringKeys[i];
	module.exports[key] = STRINGS[key];
}