#!/usr/bin/env node


require('machine-as-script')({

  // TODO: require('treeline-installer')
  // (but not until it's no longer a circular dependency)
  machine: require('../machines/install-treeline-deps')

}).exec({

  success: function () {
    var chalk = require('chalk');
    console.log('Successfully installed dependencies from treeline.io.');
  }

});
