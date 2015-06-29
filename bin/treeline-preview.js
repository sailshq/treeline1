#!/usr/bin/env node

require('machine-as-script')( {
  machine: require('../machines/start-developing'),
  args: ['type']
}).configure({
  onAuthenticated: function (){
    var chalk = require('chalk');
    console.log(chalk.gray('Authenticated successfully.'));
  },
  onConnected: function (){
    var chalk = require('chalk');
    console.log(chalk.gray('Now connected to Treeline mothership.'));
  },
  onSyncError: function (err){
    var chalk = require('chalk');
    console.error(chalk.red('Failed to sync changes from http://treeline.io to the local machinepack.'));
    console.error();
    console.error('Error details:');
    console.error(err);
  },
  onSyncSuccess: function (){
    var chalk = require('chalk');
    console.log(chalk.cyan('Successfully synchronized local project with updated logic from http://treeline.io.'));
  },
  onSocketDisconnect: function (){
    console.error();
    console.error('Whoops, looks like you\'ve lost connection to the internet.  Would you check your connection and try again?  While unlikely, it is also possible that the Treeline mothership went offline (i.e. our servers are down.)  If you\'re having trouble reconnecting and think that might be the case, please send us a note at support@treeline.io.  Thanks!');
    console.error('Attempting to reconnect...   (press <CTRL+C> to quit)');
  },
  onFlushError: function (err){
    console.error();
    console.error('Failed to flush local router after synchronizing project files from http://treeline.io.');
    console.error('Error details:');
    console.error(err);
  }
}).exec({

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
    var _ = require('lodash');
    var chalk = require('chalk');
    console.error(chalk.red('An error occurred while communicating with the Treeline mothership: '));
    console.error(_.isError(err)?err.stack:err);
    console.error('Sad face.  Please try again later.');
    process.exit(1);
  }

});
