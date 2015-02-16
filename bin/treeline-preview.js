#!/usr/bin/env node


require('../standalone/build-script')( require('../machines/preview-app'), {

  notLinked: function (){
    var chalk = require('chalk');
    console.log('The current directory is '+ chalk.yellow('not linked') +' to Treeline.');
  }

});
