#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Unlink',


  description: 'Unlink the current directory from Treeline.',


  fn: function (inputs, exits){
    var path = require('path');
    var Filesystem = require('machinepack-fs');
    var dir = process.cwd();

    // Read and parse JSON file located at source path on disk into usable data.
    Filesystem.rmrf({
      dir: path.resolve(dir, 'treeline.json')
    }).exec(exits);
  }


}, {
  success: function (){
    var chalk = require('chalk');
    console.log('This directory is '+chalk.yellow('no longer linked')+' to Treeline.');
  }
});

