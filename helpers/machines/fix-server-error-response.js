module.exports = {
  friendlyName: "Fix server error response",
  description: "Check if the api/responses/serverError.js file in an app has a known issue, and if so, patch it.",
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
          console.log("Patching api/responses/serverError.js file...");
          FileSystem.cp({
            source: path.resolve(__dirname, "..", "..", "node_modules", "treeline-generate-backend", "templates", "api", "responses", "serverError.js"),
            destination: path.resolve(inputs.dir, "api", "responses", "serverError.js")
          }).exec({
            error: function(err) {
              console.log("Could not patch file.  Please contact support for more info.  Continuing...");
              return exits.success();
            },
            success: function() {
              console.log("File patched successfully.");
              delete require.cache[serverErrorResponsePath];
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
  }
};
