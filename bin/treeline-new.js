#!/usr/bin/env node

require('machine-as-script')({

  args: ['name'],

  machine: require('../machines/new-app')

}).exec({

  success: function (){
    console.log('New Treeline app generated.');
  }

});
