/**
 * Module dependencies
 */

var util = require('util');
var chalk = require('chalk');




var ART =
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
'                  |HHH|         %s                    \n'+
'                  |HHH|         %s                     \n'+
'                  |HHH|                                   \n'+
'                  |HHH|         %s                     \n'+
'                  dHHHb         \n'+
'                .dFd|bHb.               o                                   \n'+
'      o       .dHFdH|HbTHb.          o /                                   \n'+
'\\  Y  |  \\__,dHHFdHH|HHhoHHb.         Y                                   \n'+
'##########################################                                   \n'+
'                                   \n';

module.exports = function getTree(opts) {
  var moduleName = chalk.bold(chalk.green('Treeline'));
  var version = chalk.gray('CLI v'+opts.version);
  var url = chalk.underline.cyan('http://treeline.io');
  return util.format(ART, moduleName, version, url);
};


// var ART =
// '\n'+
// '                                             $                                  \n'+
// '                                             $$                                 \n'+
// '                           Z                $$$$                Z               \n'+
// '                           Z               $$$$$                ZZ              \n'+
// '                          ZZZ              $$$$$$              ZZZ              \n'+
// '          ZZ              ZZZZ            $$$$$$$              ZZZZ             \n'+
// '          ZZ             ZZZZZ            $$$$$$$$            ZZZZZ             \n'+
// '         ZZZZ            ZZZZZZ          $$$$$$$$$$           ZZZZZZ            \n'+
// '         ZZZZ           ZZZZZZZ          $$$$$$$$$$          ZZZZZZZZ           \n'+
// '        ZZZZZZ          ZZZZZZZZ        $$$$$$$$$$$$         ZZZZZZZZ           \n'+
// '        ZZZZZZZ        ZZZZZZZZZZ       $$$$$$$$$$$$        ZZZZZZZZZZ          \n'+
// '       ZZZZZZZZ       ZZZZZZZZZZZ      $$$$$$$$$$$$$$       ZZZZZZZZZZ          \n'+
// '       ZZZZZZZZZ      ZZZZZZZZZZZZ     $$$$$$$ $$$$$$$     ZZZZZZZZZZZZ         \n'+
// '      ZZZZZZZZZZ     ZZZZZZ  ZZZZZ    $$$$$$$$ $$$$$$$     ZZZZZZ ZZZZZZ        \n'+
// '      ZZZZZ ZZZZZ    ZZZZZZ  ZZZZZZ   $$ $$$$$ $$$$ $$$   ZZZZZZZ ZZZZZZ        \n'+
// '     ZZZZZZ ZZZZZZ  ZZZZZZZ  ZZZZZZZ $$$$  $$$ $$$  $$$   ZZZZZZZ ZZZZZZZ       \n'+
// '     ZZZZZZ ZZZZZZ  ZZZ  ZZ  ZZ  ZZZ $$$$$  $$ $  $$$$$$ ZZZ  ZZZ ZZZ ZZZ       \n'+
// '    ZZZ ZZZ ZZ  ZZZZZZZZZ Z  Z ZZZZZ$$$$$$$$    $$$$$$$$$ZZZZZ ZZ Z  ZZZZZ      \n'+
// '    ZZZZ  Z Z ZZZZZZZZZZZZ    ZZZZZZ$$$$$$$$$  $$$$$$$$$$ZZZZZZ    ZZZZZZZZ     \n'+
// '   ZZZZZZZ   ZZZZZZZZZZZZZZ  ZZZZZZ$$$$$ $$$$$ $$$$ $$$$$$ZZZZZZZ ZZZZZZZZZ     \n'+
// '   ZZZZZZZZ ZZZZZZZZZZ  ZZZ  ZZZ ZZ$$$$$$  $$$ $$  $$$$$$$ZZ ZZZZ ZZZ  ZZZZZ    \n'+
// '  ZZZZZ ZZZ ZZ  ZZZZZZZZ  Z  Z  ZZ$$$$$$$$$ $$ $  $$$$$$$$$ZZ  ZZ Z  ZZZZZZZ    \n'+
// ' ZZZZZZZZ Z Z ZZZZZZZZZZZZ    ZZZZ$$$$$$$$$$    $$$$$$$$$$$$ZZZ    ZZZZZZZZZZ   \n'+
// ' ZZZZZZZZZ   ZZZZZZZZZZZZZZ  ZZZZ$$$$$$$$$$$$$ $$$$$$$$$$$$$ZZZZ  ZZZZZZZZZZZZ  \n'+
// 'ZZZZZZZZZZZ ZZZZZZZZZZZZZZZ  ZZZZ$$$$$$$$$$$$$ $$$$$$$$$$$$$$ZZZZ ZZZZZZZZZZZZ  \n'+
// 'ZZZZZZZZZZZ ZZZZZZZZZZZZZZZ  ZZZ$$$$$$$$$$$$$$ $$$$$$$$$$$$$$ZZZZ ZZZZZZZZZZZZZ \n'+
// 'ZZZZZZZZZZZ ZZZZZZZZZZZZZZZ  ZZZ$$$$$$$$$$$$$$ $$$$$$$$$$$$$$$ZZZ ZZZZZZZZZZZZZZ\n'+
// '';

// module.exports = function getTree(opts){

//   var ABOUT =
//   '\n'+
//   '\n'+
//   '                _,-\'""   """"`--.                                   \n'+
//   '             ,-\'          __,,-- \\                                   \n'+
//   '           ,\'    __,--""""dF      )                                   \n'+
//   '          /   .-"Hb_,--""dF      /                                   \n'+
//   '        ,\'       _Hb ___dF"-._,-\'                                   \n'+
//   '      ,\'      _,-""""   ""--..__                                   \n'+
//   '     (     ,-\'                  `.                                   \n'+
//   '      `._,\'     _   _             ;                                   \n'+
//   '       ,\'     ,\' `-\'Hb-.___..._,-\'                                   \n'+
//   '       \\    ,\'"Hb.-\'HH`-.dHF"                                   \n'+
//   '        `--\'   "Hb  HH  dF"                                   \n'+
//   '                "Hb HH dF                                   \n'+
//   '                 "HbHHdF                                   \n'+
//   '                  |HHHF                                   \n'+
//   '                  |HHH|         '+chalk.bold(chalk.green('Treeline'))+'                    \n'+
//   '                  |HHH|         '+chalk.gray('CLI v'+opts.version+'')+'                     \n'+
//   '                  |HHH|                                   \n'+
//   '                  |HHH|         '+chalk.underline.cyan('http://treeline.io')+'                     \n'+
//   '                  dHHHb         \n'+
//   '                .dFd|bHb.               o                                   \n'+
//   '      o       .dHFdH|HbTHb.          o /                                   \n'+
//   '\\  Y  |  \\__,dHHFdHH|HHhoHHb.         Y                                   \n'+
//   '##########################################                                   \n'+
//   '                                   \n';
//   return ABOUT;
// };



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
