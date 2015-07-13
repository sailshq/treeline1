module.exports = {


  friendlyName: 'Add post-install script',


  description: 'Adds a postinstall script to a package.',


  inputs: {

    destination: {
      description: 'Absolute path where the postinstall file will be copied.',
      example: '/Users/mikermcneil/Desktop/foo'
    }

  },


  defaultExit: 'success',


  exits: {

    error: {
      description: 'Unexpected error occurred'
    },

    success: {
      description: 'Done.'
    },

  },


  fn: function (inputs, exits){

    var Filesystem = require('machinepack-fs');
    var path = require('path');

    Filesystem.exists({
      path: path.resolve(inputs.destination, 'postinstall.js')
    }).exec({

      error: function(err) {
        return exits.error(err);
      },

      success: function() {
        return exits.success();
      },

      // Lets copy it over
      doesNotExist: function() {

        // Copy the postinstall script into the new project's files
        Filesystem.read({
          source: path.resolve(__dirname, '../legacy/lib/apiPostInstallScript.js')
        }).exec({
          error: function (err) {
            return exits.error(err);
          },
          doesNotEist: function () {
            return exits.error();
          },
          success: function(js) {
            var postInstallPath = path.resolve(inputs.destination, 'postinstall.js');

            Filesystem.write({
              destination: postInstallPath,
              string: js
            }).exec({
              error: function (err) {
                return exits.error(err);
              },
              alreadyExists: function (){
                return exits.success();
              },
              success: function() {
                return exits.success();
              }
            });
          }
        });

      }
    });
  }

};
