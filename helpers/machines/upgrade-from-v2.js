module.exports = {
  friendlyName: "Upgrade from V2",
  description: "Perform upgrades necessary to fix issues migrating to v3 of the CLI",
  extendedDescription: "Check if the api/responses/serverError.js and/or api/responses/negotiate.js files in an app have known issues, and if so, patch them.  Also remove api/machines folder, postinstall script and sails-hook-machines.",
  inputs: {
    dir: {
      description: 'Path to the local project.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    }
  },
  fn: function(inputs, exits) {
    var FileSystem = require('machinepack-fs');
    var path = require('path');
    var async = require('async');

    async.parallel({
      fixServerErrorJs: function(next) {

        try {
          // Get the copy of serverError.js in the project, if any
          var serverErrorResponsePath = path.resolve(inputs.dir, "api", "responses", "serverError.js");
          var serverErrorResponse = require(serverErrorResponsePath);
          try {
            // Try running it with an empty data object argument
            serverErrorResponse.apply({req: {}, res: {}}, [{}]);
          } catch (e) {
            // If we get a "_ is not defined" error, we have the old serverError.js
            // that was relying on Lodash being globalized
            if (e.message.match(/_ is not defined/)) {
              // Attempt to copy the newer version of serverError over
              console.log("Upgrade from CLI V2: Patching api/responses/serverError.js file.");
              FileSystem.cp({
                source: path.resolve(__dirname, "..", "..", "node_modules", "treeline-generate-backend", "templates", "api", "responses", "serverError.js"),
                destination: path.resolve(inputs.dir, "api", "responses", "serverError.js")
              }).exec({
                error: function(err) {
                  console.log("Upgrade from CLI V2: Could not patch file.  Please contact support for more info.  Continuing...");
                  return exits.success();
                },
                success: function() {
                  delete require.cache[serverErrorResponsePath];
                  return next();
                }
              });
            } else {
              // Any other error is fine; it's either due to not having full req/res objects
              // in the context for our test, or user error in a custom serverError.js file
              return next();
            }
          }
        }
        // If we can't get the serverError.js file, it either doesn't exist (in which case the
        // Sails default will be used) or there's an error in due to a user customization.
        // Either of these cases is not something CLI is concerned with.
        catch (e) {
          return next();
        }

      },
      fixNegotiateJs: function(next) {

        try {
          // Get the copy of serverError.js in the project, if any
          var negotiateResponsePath = path.resolve(inputs.dir, "api", "responses", "negotiate.js");
          var negotiateResponse = require(negotiateResponsePath);
          try {
            // Try running it with a 400 status
            negotiateResponse.apply({req: {}, res: {}}, [{status: 400, code: 'E_MACHINE_RUNTIME_VALIDATION'}]);
          } catch (e) {
            // If we get a "sails is not defined" error, we have the old negotiate.js
            // that was relying on Sails being globalized
            if (e.message.match(/sails is not defined/)) {
              // Attempt to copy the newer version of serverError over
              console.log("Upgrade from CLI V2: Patching api/responses/negotiate.js file");
              FileSystem.cp({
                source: path.resolve(__dirname, "..", "..", "node_modules", "treeline-generate-backend", "templates", "api", "responses", "negotiate.js"),
                destination: path.resolve(inputs.dir, "api", "responses", "negotiate.js")
              }).exec({
                error: function(err) {
                  console.log("Upgrade from CLI V2: Could not patch file.  Please contact support for more info.  Continuing...");
                  return exits.success();
                },
                success: function() {
                  delete require.cache[negotiateResponsePath];
                  return exits.success();
                }
              });
            } else {
              // Any other error is fine; it's either due to not having full req/res objects
              // in the context for our test, or user error in a custom serverError.js file
              return exits.success();
            }
          }
        }
        // If we can't get the serverError.js file, it either doesn't exist (in which case the
        // Sails default will be used) or there's an error in due to a user customization.
        // Either of these cases is not something CLI is concerned with.
        catch (e) {
          return exits.success();
        }

      },

      removeApiMachinesFolder: function(next) {

        var thePath = path.resolve(inputs.dir, "api", "machines");
        FileSystem.exists({
          path: thePath
        }).exec({
          success: function() {
            console.log("Upgrade from CLI V2: Removing api/machines folder");
            FileSystem.rmrf({
              dir: thePath
            }).exec(next);
          },
          doesNotExist: next,
          error: next
        });

      },

      removeSailsHookMachines: function(next) {

        var hookPath = path.resolve(inputs.dir, "node_modules", "sails-hook-machines");

        FileSystem.exists({
          path: hookPath
        }).exec({
          success: function() {
            console.log("Upgrade from CLI V2: Removing sails-hook-machines hook");
            // Remove the dependency from package.json
            FileSystem.readJson({
              source: path.resolve(inputs.dir, "package.json"),
              schema: '*'
            }).exec({
              error: next,
              success: function(packageJson) {
                if (packageJson.dependencies) {
                  delete packageJson.dependencies['sails-hook-machines'];
                  FileSystem.writeJson({
                    json: packageJson,
                    destination: path.resolve(inputs.dir, "package.json"),
                    force: true
                  }).exec({
                    error: next,
                    // Then uninstall the hook from node_modules, otherwise the Sails
                    // app will detect it.
                    success: function() {
                      FileSystem.rmrf({
                        dir: hookPath
                      }).exec(next);
                    }
                  });
                }
              }
            });
          },
          doesNotExist: next,
          error: next
        });

      },

      removePostinstall: function(next) {

        var piPath = path.resolve(inputs.dir, "node_modules", "sails-hook-machines");

        FileSystem.exists({
          path: piPath
        }).exec({
          success: function() {
            console.log("Upgrade from CLI V2: Removing postinstall.js script");
            FileSystem.rmrf({
              dir: piPath
            }).exec(next);
          },
          error: next,
          doesNotExist: next
        });

      }

    }, function done() {
      return exits.success();
    });


  }
};
