#!/usr/bin/env node


require('machine-as-script')( require('../helpers/machines/login')).exec({

  unrecognizedCredentials: function (){
    var chalk = require('chalk');
    console.log();
    console.log(chalk.bold(chalk.yellow('Unrecognized username/password combination.')));
    console.log('Please try again, or visit '+chalk.underline('http://treeline.io')+' to reset your password or locate your username.');
    process.exit(1);
  },

  success: function (me){
    var chalk = require('chalk');
    console.log('This computer is now logged in to Treeline as '+chalk.cyan(me.username)+ '.');
  }

});
