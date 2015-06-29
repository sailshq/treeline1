module.exports = {


  friendlyName: 'Normalize project type',


  description: 'Validate+coerce the provided project type, or if unspecified, look in the package.json file and take a guess.',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project ("app" or "machinepack")',
      example: 'machinepack'
    }

  },

  exits: {

    unknownType: {
      description: 'Unknown project type.  I know about two types: "app" and "machinepack".'
    },

    success: {
      example: 'machinepack'
    }

  },


  fn: function (inputs, exits){

    var path = require('path');
    var Filesystem = require('machinepack-fs');
    var IfThen = require('machinepack-ifthen');
    var thisPack = require('../');


    // If `inputs.type` was provided, use it.
    // Otherwise, sniff around for the package.json file and figure out
    // what kind of project this is.
    IfThen.ifThenFinally({

      bool: !inputs.type,

      then: function (_i, _exits){
        // Read and parse the package.json file.
        Filesystem.readJson({
          source: path.resolve(process.cwd(), 'package.json'),
          schema: {
            machinepack: {}
          }
        }).exec({
          // An unexpected error occurred.  Could be no file exists at the
          // provided `source` path.
          error: _exits.error,
          // OK.
          success: function (packageJson){
            // If we see a `machinepack.machines` array, we'll assume this must be
            // a machinepack.
            if (packageJson.machinepack.machines) {
              inputs.type = 'machinepack';
            }
            // Otherwise... welp I guess it's an app.
            else {
              inputs.type = 'app';
            }

            return _exits.success();
          },
        });
      }

    }).exec({

      error: exits.error,

      success: function (){

        // Link either an app or a machinepack
        switch (inputs.type.toLowerCase()) {
          case 'machinepack':
          case 'pack':
          case 'p':
            return exits.success('machinepack');

          case 'a':
          case 'ap':
          case 'app':
            return exits.success('app');

          default:
            return exits.unknownType();
        }
      }

    });

  }

};
