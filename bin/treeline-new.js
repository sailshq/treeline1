#!/usr/bin/env node

// Quick hack to enable usage of sails new directly from treeline CLI for convenience.
var yargs = require('yargs');
require('../node_modules/sails/bin/sails-new')((function (){
  var newAppArg;
  try {
    return yargs.argv._[0];
  }
  catch (e){ return ''; }
})(), 'unused');

// require('../standalone/build-script')(require('../machines/new-app'), {
//   success: function (){
//     var chalk = require('chalk');
//     console.log('New app generated.');
//   }
// });
