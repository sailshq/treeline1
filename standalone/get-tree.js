/**
 * Module dependencies
 */

var chalk = require('chalk');



module.exports = function getTree(opts){

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
  '                  |HHH|         '+chalk.gray('CLI v'+opts.version+'')+'                     \n'+
  '                  |HHH|                                   \n'+
  '                  |HHH|         '+chalk.underline.cyan('http://treeline.io')+'                     \n'+
  '                  dHHHb         \n'+
  '                .dFd|bHb.               o                                   \n'+
  '      o       .dHFdH|HbTHb.          o /                                   \n'+
  '\\  Y  |  \\__,dHHFdHH|HHhoHHb.         Y                                   \n'+
  '##########################################                                   \n'+
  '                                   \n';
  return ABOUT;
};



// TODO:
// tree randomizer (use fractals & season-awareness)
// ~mike
//
//
// log("                                                         .");
// log("                                              .         ;  ");
// log("                 .              .              ;%     ;;   ");
// log("                   ,           ,                :;%  %;   ");
// log("                    :         ;                   :;%;'     .,   ");
// log("           ,.        %;     %;            ;        %;'    ,;");
// log("             ;       ;%;  %%;        ,     %;    ;%;    ,%'");
// log("              %;       %;%;      ,  ;       %;  ;%;   ,%;' ");
// log("               ;%;      %;        ;%;        % ;%;  ,%;'");
// log("                `%;.     ;%;     %;'         `;%%;.%;'");
// log("                 `:;%.    ;%%. %@;        %; ;@%;%'");
// log("                    `:%;.  :;bd%;          %;@%;'");
// log("                      `@%:.  :;%.         ;@@%;'   ");
// log("                        `@%.  `;@%.      ;@@%;         ");
// log("                          `@%%. `@%%    ;@@%;        ");
// log("                            ;@%. :@%%  %@@%;       ");
// log("                              %@bd%%%bd%%:;     ");
// log("                                #@%%%%%:;;");
// log("                                %@@%%%::;");
// log("                                %@@@%(o);  . '         ");
// log("                                %@@@o%;:(.,'         ");
// log("                            `.. %@@@o%::;         ");
// log("                               `)@@@o%::;         ");
// log("                                %@@(o)::;        ");
// log("                               .%@@@@%::;         ");
// log("                               ;%@@@@%::;.          ");
// log("                              ;%@@@@%%:;;;. ");
// log("                          ...;%@@@@@%%:;;;;,..");
