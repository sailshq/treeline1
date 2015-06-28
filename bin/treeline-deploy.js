#!/usr/bin/env node
var chalk = require('chalk');
console.log(chalk.red('Sorry, the `treeline deploy` command cannot be used during the beta.'));
console.log('Fortunately, deploying a Treeline app is just like deploying any other Sails.js app (or Node.js app for that matter).');
console.log('You can read more about deploying Sails.js/Treeline apps here:');
console.log(chalk.blue(chalk.underline('http://sailsjs.org/documentation/concepts/deployment')));
console.log();
console.log('Please contact support@treeline.io if you need additional help getting your app running in production.');
