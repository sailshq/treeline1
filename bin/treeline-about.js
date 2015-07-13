#!/usr/bin/env node

require('machine-as-script')({
  machine: require('../helpers/machines/build-ascii-art')
}).exec({
  success: function (art){
    var chalk = require('chalk');

    console.log(art);
    console.log(chalk.gray('(run `treeline help` for a full list of available commands)'));
    console.log();
  }
});
