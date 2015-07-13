#!/usr/bin/env node


require('machine-as-script')( require('../helpers/machines/login')).exec({

  success: function (me){
    var chalk = require('chalk');
    console.log('This computer is now logged in to Treeline as '+chalk.cyan(me.username)+ '.');
  }

});
