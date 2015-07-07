module.exports = {


  friendlyName: 'Build ASCII art',


  description: 'Build a string that can be logged to draw the Treeline logo.',


  cacheable: true,


  sync: true,


  exits: {

    success: {
      variableName: 'art',
      example: '....a big string....',
      description: 'Done.',
    },

  },


  fn: function (inputs,exits) {

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

    var TREELINE_CLI_VERSION = require('../../package.json').version;

    var coloredArt = formatPretty(ART, [{
      str: 'Treeline',
      colors: ['white', 'bold']
    }, {
      str: 'CLI v'+TREELINE_CLI_VERSION,
      colors: ['gray']
    }, {
      str: 'http://treeline.io',
      colors: ['blue', 'underline']
    }]);

    /**
     * Helper function that, given a string and a set of replacement mappings,
     * replaces occurences of the specified substrings with the colored version,
     * adjusting whitespace accordingly.
     *
     * @param  {[type]} str          [description]
     * @param  {[type]} replacements [description]
     * @return {[type]}              [description]
     */
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

        return replacementStr + trimmed;
      });
    }

    return exits.success(coloredArt);


  },



};
