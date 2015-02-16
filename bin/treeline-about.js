#!/usr/bin/env node

/**
 * Module dependencies
 */

var util = require('util');
var program = require('commander');
var chalk = require('chalk');



var VERSION = require('../package.json').version;



program
.usage('[options]')
.parse(process.argv);


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
'                  |HHH|         '+chalk.gray('CLI v'+VERSION+'')+'                     \n'+
'                  |HHH|                                   \n'+
'                  |HHH|         '+chalk.underline('http://treeline.io')+'                     \n'+
'                  dHHHb         \n'+
'                .dFd|bHb.               o                                   \n'+
'      o       .dHFdH|HbTHb.          o /                                   \n'+
'\\  Y  |  \\__,dHHFdHH|HHhoHHb.         Y                                   \n'+
'##########################################                                   \n'+
'                                   \n';


console.log(ABOUT);

console.log(chalk.gray('(run `treeline help` for a list of available commands)'));
console.log();
