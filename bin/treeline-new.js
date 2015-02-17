#!/usr/bin/env node


require('../standalone/build-script')(require('../machines/generate-new'), {
  success: function (){
    var chalk = require('chalk');
    console.log('New app generated.');
  }
});
