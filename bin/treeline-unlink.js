#!/usr/bin/env node


require('../standalone/build-script')(require('../machines/logout'), {
  success: function (){
    var chalk = require('chalk');
    console.log('This directory is '+chalk.yellow('no longer linked')+' to Treeline.');
  }
});

