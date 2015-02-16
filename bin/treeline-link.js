#!/usr/bin/env node


require('../standalone/build-script')( require('../machines/link-app'), {

  success: function (linkedProject){
    var chalk = require('chalk');

    var slug = linkedProject.owner + '/' + linkedProject.identity;
    console.log();
    console.log(chalk.gray('(created '+chalk.bold('treeline.json')+')'));
    console.log('Current directory now linked to %s on Treeline.', chalk.cyan(slug));
  }

});
