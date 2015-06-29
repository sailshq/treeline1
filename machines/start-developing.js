module.exports = {


  friendlyName: 'Start interactive development session',


  description: 'Start a local/development preview session with an app or machinepack.',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project this is ("app" or "machinepack")',
      extendedDescription: 'If left unspecified, we\'ll sniff around in the directory and guess what kind of thing this is based on its package.json file.',
      example: 'machinepack'
    },

    onAuthenticated: {
      description: 'An optional notifier function that will be called when authentication is complete.',
      example: '->'
    },

    onConnected: {
      description: 'An optional notifier function that will be called when a connection is established with Treeline.io and this pack is being initially synchronized with the server.',
      example: '->'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    }

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    unknownType: {
      description: 'Unknown project type.  You can link an "app" or a "machinepack".'
    },

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
    },

    noApps: {
      description: 'No apps belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    noMachinepacks: {
      description: 'No machinepacks belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    forbidden: {
      description: 'Unrecognized username/password combination.',
      extendedDescription: 'Please try again or visit http://treeline.io to reset your password or locate your username.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      variableName: 'result',
      description: 'Done.',
      example: '==='
    },

  },


  fn: function (inputs,exits) {

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
      success: function() {

        // Link either an app or a machinepack
        switch (inputs.type) {
          case 'machinepack':
          case 'mp':
          case 'pack':
          case 'p':
            return thisPack.startDevelopingPack(inputs).exec(exits);

          case 'a':
          case 'ap':
          case 'app':
            return thisPack.startDevelopingApp(inputs).exec(exits);

          default:
            return exits.unknownType();
        }
      },
    });

  },



};
