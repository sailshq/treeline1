#!/usr/bin/env node


require('../standalone/build-script')({

  args: ['username'],

  machine: require('../machines/export-pack')

}, {

  success: function (packName) {
    var chalk = require('chalk');
    console.log('Exported '+chalk.cyan(packName)+ ' machinepack from Treeline to a local folder.');
  },

  notLoggedIn: function () {
    var chalk = require('chalk');
    console.log('This computer is '+chalk.yellow('not logged in')+' to Treeline.');
  },

  alreadyExists: function (destinationPath){
    console.log('A file or folder with the same name as this machinepack already exists at the destination path (%s).', destinationPath);
  }

});
