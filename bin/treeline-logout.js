#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Log out',


  description: '',


  fn: function (inputs, exits){
    var path = require('path');
    var Filesystem = require('machinepack-fs');

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.rmrf({
      dir: path.resolve(Filesystem.getHomeDirpath().execSync(), '.treeline.secret.json'),
    }).exec(exits);
  }


}, {
  success: function (){
    var chalk = require('chalk');
    console.log('This computer is now '+chalk.yellow('logged out')+' of Treeline.');
  }
});
