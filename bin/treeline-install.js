#!/usr/bin/env node


require('machine-as-script')({

  machine: require('../machines/install-treeline-deps')

}).exec({

  success: function () {
    var chalk = require('chalk');
    console.log('Installed dependencies from treeline.io.');
  }

});
