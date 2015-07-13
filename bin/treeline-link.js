#!/usr/bin/env node


require('machine-as-script')( {
  machine: require('../helpers/machines/link'),
  args: ['type']
}).exec({

  success: function (linkedProject){
    var chalk = require('chalk');

    // var slug = linkedProject.owner + '/' + linkedProject.identity;
    var slug = linkedProject.identity;
    var displayName = linkedProject.displayName;
    console.log();
    console.log(chalk.gray('(created '+chalk.bold('treeline.json')+')'));
    console.log('Current directory now linked to %s on Treeline.', chalk.cyan(displayName));
  },

  noApps: function (data){
    var chalk = require('chalk');
    console.log();
    console.log('Looks like you don\'t have any apps in your account yet, %s.', chalk.cyan(data.username));
    console.log('You should visit http://treeline.io and create one!');
  },

  forbidden: function (){
    var chalk = require('chalk');
    console.error('Could not authenticate this computer with Treeline.');
    console.error('Perhaps your Treeline secret file is corrupted or missing, or maybe you provided an invalid username/password combo?');
    console.error('Please log in again with `treeline login`.');
  }

});
