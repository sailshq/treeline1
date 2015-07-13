#!/usr/bin/env node


require('machine-as-script')(require('../helpers/machines/logout')).exec({
  success: function (){
    var chalk = require('chalk');
    console.log('This computer is now '+chalk.yellow('logged out')+' of Treeline.');
  }
});
