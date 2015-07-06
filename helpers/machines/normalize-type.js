module.exports = {


  friendlyName: 'Normalize project type',


  description: 'Validate+coerce the provided project type, or if unspecified, look in the package.json file and take a guess.',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project ("app" or "machinepack")',
      example: 'machinepack'
    },

    dir: {
      description: 'Path to the local project.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
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

    // Ensure we have an absolute destination path.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    // If `inputs.type` was provided, use it.
    // Otherwise, sniff around for the package.json/treeline.json files
    // to figure out what kind of project this is.
    IfThen.ifThenFinally({

      bool: !inputs.type,

      expectedOutput: 'app or pack',

      then: function (_i, _exits){

        // Read and parse the linkfile
        thisPack.readLinkfile({
          dir: inputs.dir
        }).exec(function (err, linkedProjectInfo){
          // Tolerate errors and just try next approach if this doesn't work.
          if (!err) {
            return _exits.success(linkedProjectInfo.type);
          }
          // Read and parse the package.json file.
          Filesystem.readJson({
            source: path.join(inputs.dir, 'package.json'),
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

              return _exits.success(inputs.type);
            },
          });

        });

      },

      orElse: function (__, _exits) {
        return _exits.success(inputs.type);
      }

    }).exec({

      error: exits.error,

      success: function (type){

        // Link either an app or a machinepack
        switch (type.toLowerCase()) {
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
