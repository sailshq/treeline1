#!/usr/bin/env node


require('../standalone/build-script')( {
  machine: require('../machines/start-developing'),
  args: ['type']
}, {

  notLinked: function (){
    var chalk = require('chalk');
    console.log('The current directory is '+ chalk.yellow('not linked') +' to Treeline.');
  },

  noApps: function (data){
    var chalk = require('chalk');
    console.log();
    console.log('Looks like you don\'t have any apps in your account yet, %s.', chalk.cyan(data.username));
    console.log('You should visit http://treeline.io and create one!');
  },

  requestFailed: function(url) {
    var chalk = require('chalk');
    console.log(chalk.red('Could not communicate with the Treeline mothership at ') + url + '.' + chalk.red(' Are you connected to the internet?'));
  },

  error: function(err) {
    var chalk = require('chalk');
    console.log(chalk.red('An error occurred while communicating with the Treeline mothership: '), err);
    console.log("Sad face.  Please try again later.");
    process.exit(1);
  }

});
