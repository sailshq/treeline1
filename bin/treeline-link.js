#!/usr/bin/env node


require('../standalone/build-script')( require('../machines/link-app'), {

  success: function (slug){
    var chalk = require('chalk');
    console.log();
    console.log(chalk.gray('(created '+chalk.bold('treeline.json')+')'));
    console.log('Current directory now linked to %s on Treeline.', chalk.cyan(slug));
  }

});
