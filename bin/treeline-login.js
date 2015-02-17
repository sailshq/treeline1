#!/usr/bin/env node


require('../standalone/build-script')( require('../machines/login'), {

  success: function (me){
    var chalk = require('chalk');
    console.log('This computer is now logged in to Treeline as '+chalk.cyan(me.username)+ '.');
  }

});
