
var chalk = require('chalk');


var ART =
'\n'+
'                     OOOOO           '+'\n'+
'                    OOOOOOO          '+'\n'+
'                    OOOOOO           '+'\n'+
'                     OOOO            '+'\n'+
'                    //               '+'\n'+
'                   //                '+'\n'+
'    OOOO       §§§§§        %s       '+'\n'+
'   OOOOOO/////§§§§§§§       %s       '+'\n'+
'   OOOOOO     §§§§§§§                '+'\n'+
'    OOOO       §§§§§        %s       '+'\n'+
'                   \\\\              '+'\n'+
'                    \\\\             '+'\n'+
'                     OOOOO           '+'\n'+
'                    OOOOOOO          '+'\n'+
'                    OOOOOOO          '+'\n'+
'                     OOOOO           '+'\n'+
'                                     '+'\n'+
'';


ART = ART.replace(/O/g, chalk.cyan(chalk.bgCyan('O')));
ART = ART.replace(/§/g, chalk.green(chalk.bgGreen('§')));
ART = ART.replace(/\//g, chalk.bgWhite(chalk.white('/')));
ART = ART.replace(/\\/g, chalk.bgWhite(chalk.white('\\')));

// var ART =
// '\n'+
// '                   Z,               \n'+
// '                   ZZ               \n'+
// '                  ZZZ               \n'+
// '                  ZZZZ               \n'+
// '                 OZZZZ               \n'+
// '                 ZZZZZZ             \n'+
// '      O         ZZZZZZZ              \n'+
// '     OO         ZZZZZZZZ               \n'+
// '     OOO       $ZZZZZZZZ               \n'+
// '    OOOO       ZZZZZZZZZZ               \n'+
// '    OOOOO      ZZZZZZZZZZ               \n'+
// '   OOOIOO     ZZZZZ||ZZZZI               \n'+
// '   OO||OO?    ZZZZZ||ZZZZZZ               \n'+
// '  O\\O||O/O   ZZZZZZ||ZZZZZZ               \n'+
// '  OO\\||/0O   ZZZ\\\\Z||Z//ZZZ               \n'+
// ' +OOO||OOOO ZZZZZ\\\\||//ZZZZZ               \n'+
// ' O\\\\0||O//  ZZZ\\\\Z\\||/Z//ZZZ               \n'+
// ' OO\\\\||//O ZZZZZ\\\\Z||Z//ZZZZZ               \n'+
// 'OOOO\\||/O  ZZZZZZ\\\\||//ZZZZZZ               \n'+
// 'OOOO0|/OO ZZZZZZZZZ\\|ZZZZZZZZZ              \n'+
// '     |              \\                           o \n'+
// '     |               \\____       o       o  ___/  __o    \n'+
// '    _|  _o                \\_____/    ___/__/_____/               \n'+
// ' o_/ |_/                        \\___/   \\  \\                 \n'+
// '     | \\_o                          \\    \\  \\__o        \n'+
// '     |            %s                  o    \\        \n'+
// '     |_o          %s                        \\___         \n'+
// '     |                                      \\  \\    \n'+
// '     |   o        %s                          \\  o          \n'+
// '     |__/                                     o          \n'+
// '        \\____                                                \n'+
// '         \\   \\                                                \n'+
// '          o   o                                                \n'+
// '\n';


module.exports = function getTree(opts) {
  // var moduleName = chalk.bold(chalk.green('Treeline'));
  // var version = chalk.gray('CLI v'+opts.version);
  // var url = chalk.underline.cyan('http://treeline.io');

  return formatPretty(ART, [{
    str: 'Treeline',
    colors: ['white', 'bold']
  }, {
    str: 'CLI v'+opts.version,
    colors: ['gray']
  }, {
    str: 'http://treeline.io',
    colors: ['blue', 'underline']
  }]);
};

function formatPretty(str, replacements){
  var _ = require('lodash');
  var chalk = require('chalk');

  return str.replace(/%s([^\n]*)/g, function (entireMatch, subMatch, atIndex, completeStr){

    var replacement = replacements.shift();
    var replacementStr = replacement.str;
    var replacementLen = replacementStr.length;
    if (replacement.colors && _.isArray(replacement.colors)) {
      replacementStr = _.reduce(replacement.colors, function (memo, color){
        return chalk[color](memo);
      }, replacementStr);
    }

    // Trim submatch
    var trimmed = entireMatch.slice(replacementLen + 1);

    // console.log('\n');
    // console.log('befor:'+(entireMatch));
    // console.log('(len):'+(entireMatch.length));
    // console.log('repla:'+replacementStr);
    // console.log('(len):'+(replacementLen));
    // // console.log('combo:'+replacementStr+subMatch);
    // // console.log('trimd:'+trimmed);
    // // console.log('(len):'+(trimmed.length));
    // console.log('after:'+replacementStr+trimmed);


    return replacementStr + trimmed;
  });
}




// var ART =
// '\n'+
// '                   Z,               \n'+
// '                   ZZ               \n'+
// '                  ZZZ               \n'+
// '                  ZZZZ               \n'+
// '                 OZZZZ               \n'+
// '                 ZZZZZZ             \n'+
// '      O         ZZZZZZZ              \n'+
// '     OO         ZZZZZZZZ               \n'+
// '     OOO       $ZZZZZZZZ               \n'+
// '    OOOO       ZZZZZZZZZZ               \n'+
// '    OOOOO      ZZZZZZZZZZ               \n'+
// '   OOOIOO     ZZZZZ||ZZZZI               \n'+
// '   OO||OO?    ZZZZZ||ZZZZZZ               \n'+
// '  O\\O||O/O   ZZZZZZ||ZZZZZZ               \n'+
// '  OO\\||/0O   ZZZ\\\\Z||Z//ZZZ               \n'+
// ' +OOO||OOOO ZZZZZ\\\\||//ZZZZZ               \n'+
// ' O\\\\0||O//  ZZZ\\\\Z\\||/Z//ZZZ               \n'+
// ' OO\\\\||//O ZZZZZ\\\\Z||Z//ZZZZZ               \n'+
// 'OOOO\\||/O  ZZZZZZ\\\\||//ZZZZZZ               \n'+
// 'OOOO0|/OO ZZZZZZZZZ\\|ZZZZZZZZZ              \n'+
// '     |              \\                     \n'+
// '     |               \\____    o                  \n'+
// '    _|  _o                \\__/                      \n'+
// ' o_/ |_/      %s             \\__o    o               \n'+
// '     | \\_o    %s              \\_____/                 \n'+
// '     |                         \\    \\                   \n'+
// '     |_o      %s                \\    o                   \n'+
// '                                 \\                   \n'+
// '                                                      \n'+
// '\n';



/*

 /\
//\\


 */

/*


                   Z,
                   ZZ
                  ZZZ
                  ZZZZ
                 OZZZZ
                 ZZZZZZ
      O         ZZZZZZZ
     OO         ZZZZZZZZ
     OOO       $ZZZZZZZZ
    OOOO       ZZZZZZZZZZ
    OOOOO      ZZZZZZZZZZ
   OOOIOO     ZZZZZ||ZZZZI
   OO||OO?    ZZZZZ||ZZZZZZ
  O\O||O/O   ZZZZZZ||ZZZZZZ
  OO\||/0O   ZZZ\\Z||Z//ZZZ
 +OOO||OOOO ZZZZZ\\||//ZZZZZ
 O\\0||O//  ZZZ\\Z\||/Z//ZZZ
 OO\\||//O ZZZZZ\\Z||Z//ZZZZZ
OOOO\||/O  ZZZZZZ\\||//ZZZZZZ
OOOO0||OO ZZZZZZZZZ||ZZZZZZZZZ
     |              |
     |  _o          |  _o
     |_/            |_/  _o
     | \_o           \__/
     |                  \_o
     |_o


/*

// var ART =
// '\n'+
// '                   Z,               \n'+
// '                   ZZ               \n'+
// '                  ZZZ               \n'+
// '                  ZZZZ         %s    \n'+
// '                 OZZZZ         %s    \n'+
// '                 ZZZZZZ             \n'+
// '      O         ZZZZZZZ        %s    \n'+
// '     OO         ZZZZZZZZ               \n'+
// '     OOO       $ZZZZZZZZ               \n'+
// '    OOOO       ZZZZZZZZZZ               \n'+
// '    OOOOO      ZZZZZZZZZZ               \n'+
// '   OOOIOO     ZZZZZ||ZZZZI               \n'+
// '   OO||OO?    ZZZZZ||ZZZZZZ               \n'+
// '  O\\O||O/O   ZZZZZZ||ZZZZZZ               \n'+
// '  OO\\||/0O   ZZZ\\\\Z||Z//ZZZZ               \n'+
// ' +OOO||OOOO ZZZZZ\\\\||//ZZZZZ               \n'+
// ' O\\\\0||O//  ZZZ\\\\Z\\||/Z//ZZZ               \n'+
// ' OO\\\\||//O ZZZZZ\\\\Z||Z//ZZZZZ               \n'+
// 'OOOO\\||/O  ZZZZZZ\\\\||//ZZZZZZZ               \n'+
// 'OOOO0||OO  ZZZZZZZZ||ZZZZZZZZZ               \n'+
// '\n';


/*
                   Z,
                   ZZ
                  ZZZ
                  ZZZZ
                 OZZZZ
                 ZZZZZZ
      O         ZZZZZZZ
     OO         ZZZZZZZZ
     OOO       $ZZZZZZZZ
    OOOO       ZZZZZZZZZZ
    OOOOO      ZZZZZZZZZZ
   OOOIOO     ZZZZZ||ZZZZI
   OO||OO?    ZZZZZ||ZZZZZZ
  O\O||O/O   ZZZZZZ||ZZZZZZ
  OO\||/0O   ZZZ\\Z||Z//ZZZZ
 +OOO||OOOO ZZZZZ\\||//ZZZZZ
 O\\0||O//  ZZZ\\Z\||/Z//ZZZ
 OO\\||//O ZZZZZ\\Z||Z//ZZZZZ
OOOO\||/O  ZZZZZZ\\||//ZZZZZZZ
OOOO0||OO  ZZZZZZZZ||ZZZZZZZZZ


*/

/*

                    Z,
                    ZZ
                   ZZZ
                   ZZZZ
                  OZZZZ
                  ZZZZZZ
       O         ZZZZZZZ
      OO         ZZZZZZZZ
      OOO       $ZZZZZZZZ
     OOOO       ZZZZZZZZZZ
     OOOOO      ZZZZZZZZZZ
    OOOIOO     ZZZZZ|ZZZZZI
    OOO|OO?    ZZZZZ|ZZZZZZ
   OOOO|OOO   ZZZ\\Z|Z//ZZZ
   O  O|Z O   ZZZZ\\|//ZZZZZ
  +OOO | OOO ZZZZZZ\|/ZZZZZZ
  O  OO|OO   ZZZ\\ZZ|ZZ//ZZZZ
  OOO O|  O ZZZZZ\\Z|Z//ZZZZZ
 OOOOO |OO  ZZZZZZ\\|//ZZZZZZZ
 OOOOOO|OO OZZZZZZZZ|ZZZZZZZZZ
*/

//                   Z,
//                   ZZ
//                  ZZZ
//                  ZZZZ
//                 OZZZZ
//                 ZZZZZZ
//      O         ZZZZZZZ
//     OO         ZZZZZZZZ
//     OOO       $ZZZZZZZZ
//    OOOO       ZZZZZZZZZZ
//    OOOOO      ZZZZZZZZZZ
//   OOOIOO     ZZZZZ ZZZZZI
//   OOO OO?    ZZZZZ ZZZZZZ
//  OOOO OOO   ZZZZZZ ZZZZZZ
//  O  O Z O   ZZZZ Z Z  ZZZZ
// +OOO   OOO ZZZZZZ   ZZZZZZ
// O  OO OO   ZZZZ ZZ ZZ 7ZZZZ
// OOO O   O ZZZZZZ   Z OZZZZZ
// OOOOO  OO  ZZZZZZZZ  ZZZZZZZZ
// OOOOOO OO OZZZZZZZZ ZZZZZZZZZ


       //                               :
       //                               Z
       //                              $Z
       //                              ZZZ
       //                              ZZZ
       //                             ZZZZO
       //                             ZZZZZ
       //                            ZZZZZZZ
       //                            ZZZZZZZ
       //                           OZZZZZZZZ
       //                           ZZZZZZZZZ
       //          OO              ZZZZZZZZZZ~
       //          OO              ZZZZZZZZZZZ
       //         OOOO            7ZZZZZZZZZZZ
       //         OOOO            ZZZZZZZZZZZZZ
       //        OOOOOO          ~ZZZZZZZZZZZZZ
       //        OOOOOO          ZZZZZZZZZZZZZZZ
       //       $OOOOOO$         ZZZZZZZZZZZZZZZ
       //       OOOOOOOO        ZZZZZZZZZZZZZZZZZ
       //      :OOO  OOO        ZZZZZZZ+ ZZZZZZZZ
       //      OOOO  OOOO      ZZZZZZZZ: ZZZZZZZZ7
       //      OOOO  OOOO      ZZZZZZZZ, ZZZZZZZZZ
       //     OOOOO  OOOOO    ZZZZZZZZZ, ZZZZZZZZZ~
       //     OO OO  OO OO    ZZZZZZ  Z  ZZ  ZZZZZZ
       //    OOOO      OOOO  +ZZZZZZZ    7  OZZZZZZ
       //    OOOOO    OOOOO  ZZZZZZZZZ+   OZZZZZZZZO
       //   ZOOOOOO  OOOZO   ZZZZZZ ZZZ, ZZZZZZZZZZZ
       //   OOO  8O  OO  O  ZZZZZZZ  ZZ, ZZ  ZZZZZZZZ
       //  ,OOOO,      ,O   ZZZZZZZZO    Z  ZZZZZZZZZ
       //  OOOOOOO    OOO  ZZZZZZZZZZZ    ZZZZZZZZZZZZ
       //  OOOOOOOO  OOO:  ZZZZZZZZZZZZ, ZZZZZZZZZZZZZ
       // OOOOOOOOO  OOO  ZZZZZZZZZZZZZ, ZZZZZZZZZZZZZ~
       // OOOOOOOOO  OOO  ZZZZZZZZZZZZZ, ZOOOZZZZZZZZZZ



 //                 N
 //          N      N
 //         ~N,    NNN    NN
 //         NNN    NNN    NN
 //   N    7NNN:  NNNNN  NNNN
 //   NN   NNNNN  NNNNN  NNNN
 //  N$N  ZNN NN,NNN NNNNNNNNN
 //   $ON NN   NN N   N NDNDDN
 // N $N,8NNN DNN~NN NONN NN NN
 // NN$N NNNN NNNN N N NNNNNNNN






 //                          D
 //                          N
 //               NZ        NN8        :
 //               NN        NNN       ON
 //              NNNO      NNNNZ      NN~
 //              NNNN      NNNNN     ONND
 //     D       NNNNN7    NNNNNNZ    NNNN+
 //     NN      NNNNNN    NNNNNNN   8NNNNN
 //    NNN     NNNNNNN7  NNNNNNNN?  NNNNNN,
 //    NNNN    NNNNNNNN  NNNNNNNNN $NNNNNNN
 //   DN$NN   NNNN~NNNNI$NNNN NNNN DNNNDNNN,
 //   NN$NNN  NNNN~NNNNN NNNN NNN=$NNNNDNNNN
 //  ONN  NN MNNND  NNNN=ONN   NN NNNN  DDNN
 //  N D$N$, NNN D~ND,NNN N N N 7$NN,$NDD NNN
 // $NNN  N NNNNNN  NNNNN=DN, DN NNNNN  NNNNN
 // NNNN$ND NNNNNN~NNNNNNN NN N??NNNNNNDNNNNNN



/*

         /\
   .  /./|.  .\
  /|\/|/.|/.\.|\
 /\|/.|.\|/..\|.\

         | \/
    \|/ \|_/    \/
\|/  |   |   \|/  \/
 |   |  \|/   | \_/
\|/ \|/  |   \|_/


  |
  |__
    |  _o
    |_/
    |  ___o
    |_/
      \___o


  |
  |__
    |  _o
    |_/
    |  ___o
    |_/
      \___o


       |
       |
     o | o
      \|/
    o  |  o
     \_|_/
_______|__________



       ||
    o  ||  o
     \_||_/
       ||
   o   ||   o
    \  ||  /
     \_||_/
       ||
       ||


      |
      |_
       /\
    __/  \__
  _|
 /\       /\

 */

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
