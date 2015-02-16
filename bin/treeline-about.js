#!/usr/bin/env node

require('../standalone/build-script')({
  exits: {
    success: {
      example: '1.0.0'
    }
  },
  fn: function(inputs, exits) {
    var VERSION = require('../package.json').version;
    return exits.success(VERSION);
  }
}, {
  success: function (version){
    var chalk = require('chalk');

    var ABOUT =
    '\n'+
    '\n'+
    '                _,-\'""   """"`--.                                   \n'+
    '             ,-\'          __,,-- \\                                   \n'+
    '           ,\'    __,--""""dF      )                                   \n'+
    '          /   .-"Hb_,--""dF      /                                   \n'+
    '        ,\'       _Hb ___dF"-._,-\'                                   \n'+
    '      ,\'      _,-""""   ""--..__                                   \n'+
    '     (     ,-\'                  `.                                   \n'+
    '      `._,\'     _   _             ;                                   \n'+
    '       ,\'     ,\' `-\'Hb-.___..._,-\'                                   \n'+
    '       \\    ,\'"Hb.-\'HH`-.dHF"                                   \n'+
    '        `--\'   "Hb  HH  dF"                                   \n'+
    '                "Hb HH dF                                   \n'+
    '                 "HbHHdF                                   \n'+
    '                  |HHHF                                   \n'+
    '                  |HHH|         '+chalk.bold(chalk.green('Treeline'))+'                    \n'+
    '                  |HHH|         '+chalk.gray('CLI v'+version+'')+'                     \n'+
    '                  |HHH|                                   \n'+
    '                  |HHH|         '+chalk.underline.cyan('http://treeline.io')+'                     \n'+
    '                  dHHHb         \n'+
    '                .dFd|bHb.               o                                   \n'+
    '      o       .dHFdH|HbTHb.          o /                                   \n'+
    '\\  Y  |  \\__,dHHFdHH|HHhoHHb.         Y                                   \n'+
    '##########################################                                   \n'+
    '                                   \n';


    console.log(ABOUT);

    console.log(chalk.gray('(run `treeline help` for a list of available commands)'));
    console.log();

  }
});
