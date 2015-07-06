#!/usr/bin/env node


require('machine-as-script')({

  machine: require('machinepack-local-treeline-projects').installTreelineDeps()

}).exec({

  success: function () {
    var chalk = require('chalk');
    console.log('Successfully installed dependencies from treeline.io.');
  }

});
