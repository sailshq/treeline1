#!/usr/bin/env node

require('machine-as-script')({
  exits: {
    success: {
      example: '1.0.0'
    }
  },
  fn: function(inputs, exits) {
    var VERSION = require('../package.json').version;
    return exits.success(VERSION);
  }
}).exec({
  success: function (version){
    var chalk = require('chalk');
    var art = require('../standalone/get-art')({ version: version });

    console.log(art);
    console.log(chalk.gray('(run `treeline help` for a full list of available commands)'));
    console.log();

  }
});
