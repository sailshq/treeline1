#!/usr/bin/env node

require('../standalone/build-script')({
  exits: {
    success: {
      example: '1.0.0'
    }
  },
  fn: function(inputs, exits) {
    var VERSION = require('../package.json').version;
    return exits.success(VERSION);
  }
}, {
  success: function (version){
    var chalk = require('chalk');
    var tree = require('../standalone/get-tree')({ version: version });

    console.log(tree);
    console.log(chalk.gray('(run `treeline help` for a full list of available commands)'));
    console.log();

  }
});
