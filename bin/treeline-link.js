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

  unrecognizedCredentials: function (){
    var chalk = require('chalk');
    console.log();
    console.log(chalk.bold(chalk.yellow('Unrecognized username/password combination.')));
    console.log('Please try again, or visit '+chalk.underline('http://treeline.io')+' to reset your password or locate your username.');
    process.exit(1);
  },

  noApps: function (data){
    var chalk = require('chalk');
    console.log();
    console.log('Looks like you don\'t have any apps in your account yet, %s.', chalk.cyan(data.username));
    console.log('You should visit '+chalk.underline('http://treeline.io')+' and create one!');
  },

  noMachinepacks: function (data){
    var chalk = require('chalk');
    console.log();
    console.log('Looks like you don\'t have any machinepacks in your account yet, %s.', chalk.cyan(data.username));
    console.log('You should visit '+chalk.underline('http://treeline.io')+' and create one!');
  },

  forbidden: function (){
    var chalk = require('chalk');
    console.log();
    console.log(chalk.bold(chalk.yellow('Your keychain is no longer valid.')));
    console.log('It may have expired; or your account may have been suspended (but that\'s pretty unlikely-- you seem nice).');
    console.log('(it is also possible that your Treeline keychain is corrupted)');
    console.log('Please log in again with `treeline login`. If you continue to run into issues, contact '+chalk.underline('support@treeline.io')+'.');
    process.exit(1);
  }

});
