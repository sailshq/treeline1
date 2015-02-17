#!/usr/bin/env node


require('../standalone/build-script')( require('../machines/link-app'), {

  success: function (linkedProject){
    var chalk = require('chalk');

    // var slug = linkedProject.owner + '/' + linkedProject.identity;
    var slug = linkedProject.identity;
    console.log();
    console.log(chalk.gray('(created '+chalk.bold('treeline.json')+')'));
    console.log('Current directory now linked to %s on Treeline.', chalk.cyan(slug));
  },

  noApps: function (data){
    var chalk = require('chalk');
    console.log();
    console.log('Looks like you don\'t have any apps in your account yet, %s.', chalk.cyan(data.username));
    console.log('You should visit http://treeline.io and create one!');
  }

});
