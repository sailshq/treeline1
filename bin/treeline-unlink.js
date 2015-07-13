#!/usr/bin/env node


require('machine-as-script')(require('../helpers/machines/unlink')).exec({
  success: function (){
    var chalk = require('chalk');
    console.log('This directory is '+chalk.yellow('no longer linked')+' to Treeline.');
  }
});

