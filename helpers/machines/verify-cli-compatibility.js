module.exports = {

  friendlyName: 'Verify CLI compatibility',

  description: 'Determine if this version of the CLI is compatible with the Treeline API at the given URL',

  inputs: {

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    }

  },

  exits: {

    incompatible: {
      description: 'The current CLI version is incompatible with the current Treeline API',
      example: {
        minimum: "3.0.0",
        latest: "4.0.4",
        current: "3.2.4"
      },
      extendedDescription: 'Returns the minimum CLI version required'
    },

    success: {
      example: {
        minimum: "3.0.0",
        latest: "4.0.4",
        current: "3.2.4"
      }
    }

  },

  fn: function(inputs, exits) {

    var Http = require('machinepack-http');
    var Util = require('machinepack-util');
    var NPM = require('machinepack-npm');
    var path = require('path');

    // Get the latest CLI version #
    NPM.getPackageJson({
      packageName: 'treeline',
    }).exec({
      // An unexpected error occurred.  We'll ignore it.
      error: function (err){
       return next();
      },
      // Oh my.  This would be bad.  But it's probably just a problem with NPM, so we'll ignore it.
      packageNotFound: function (){
       return next();
      },
      // OK. Let's parse this sucker.
      success: function (packageJsonString){
        try {
          // Parse metadata for the latest version of the NPM package given a package.json string.
          var latestPackageJson = NPM.parsePackageJson({
            json: packageJsonString,
          }).execSync();
          // Get our own package.json
          latestCliVersion = latestPackageJson.version;
        }
        catch (e) {
          console.log(e);
          // Don't worry about errors in the above; we'll just
          // try again next time.
        }

        // Get this CLI version
        var cliVersion = require(path.resolve(__dirname, '..', '..', "package.json")).version;

        // Ask the treeline server, "are we cool?"
        // Send an HTTP request and receive the response.
        Http.sendHttpRequest({
          method: 'get',
          baseUrl: inputs.treelineApiUrl,
          url: "/api/v1/_cliRequirement",
          params: {
            cliVersion: cliVersion
          }
        }).exec({
          error: exits.error,
          // OK.
          success: function(result) {
            try {
              var minimumCli = JSON.parse(result.body);
              if (require('semver').gt(minimumCli, cliVersion)) {
                return exits.incompatible({minimum: minimumCli, latest: latestCliVersion, current: cliVersion});
              }
              return exits.success({minimum: minimumCli, latest: latestCliVersion, current: cliVersion});
            }
            catch (e) {
              return exits.error(e);
            }
          },
        });
      },
    });

  }

};
