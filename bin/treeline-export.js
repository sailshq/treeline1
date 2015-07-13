#!/usr/bin/env node


require('machine-as-script')({

  args: ['username'],

  machine: require('../helpers/machines/export-pack')

}).exec({

  success: function (result) {
    var chalk = require('chalk');
    console.log('Exported '+chalk.cyan(result.name)+ ' machinepack from Treeline to '+chalk.cyan(result.path));
  },

  notLoggedIn: function () {
    var chalk = require('chalk');
    console.log('This computer is '+chalk.yellow('not logged in')+' to Treeline.');
  },

  alreadyExists: function (destinationPath){
    console.log('A file or folder with the same name as this machinepack already exists at the destination path (%s).', destinationPath);
  }

});
