#!/usr/bin/env node


require('../standalone/build-script')(require('../machines/logout'), {
  success: function (){
    var chalk = require('chalk');
    console.log('This computer is now '+chalk.yellow('logged out')+' of Treeline.');
  }
});
