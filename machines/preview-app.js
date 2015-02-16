module.exports = {


  friendlyName: 'Preview app',


  description: 'Lift the app in the current directory, streaming down updated backend code if necessary.',


  inputs: {

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

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
    },

    forbidden: {
      description: 'Unrecognized username/password combination.',
      extendedDescription: 'Please try again or visit http://treeline.io to reset your password or locate your username.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      description: 'Done.'
    },

  },


  fn: function (inputs, exits){

    var util = require('util');
    var async = require('async');
    var Urls = require('machinepack-urls');
    var thisPack = require('../');


    async.auto({

      // Get login credentials
      me: function (next){
        thisPack.readKeychain().exec({
          error: function (err) {
            return next(err);
          },
          doesNotExist: function (){
            thisPack.login({
              treelineApiUrl: inputs.treelineApiUrl
            }).exec({
              error: next,
              success: function (me){
                return next(null, me);
              }
            });
          },
          success: function (me){
            return next(null, me);
          }
        });
      },

      // Figure out which project to lift
      link: ['me', function (next){
        thisPack.readLinkfile().exec({
          error: function (err) {
            if (err) return next(err);
          },
          doesNotExist: function (){
            thisPack.linkApp({
              treelineApiUrl: inputs.treelineApiUrl
            }).exec({
              error: next,
              success: function (linkedProject){
                return next(null, linkedProject);
              }
            });
          },
          success: function (linkedProject){
            return next(null, linkedProject);
          }
        });
      }],

      // Make sure there's a package.json
      packageJson: ['link', ensurePackageJson],

      // Make sure `machine` is installed
      _installedMachine: ['packageJson', ensureMachineRunner],

      // Make sure sails-hook-machines is installed
      _installedSailsHookMachines: ['packageJson', ensureSailsHookMachines],

      // Lift app
      _liftedApp: ['_installedMachine', '_installedSailsHookMachines', function(next, asyncData) {
        // console.log('!!! would hve previewed app!',asyncData);
        // next();

        // bring in the existing preview code
        var actions = require('../lib/actions');

        actions.run(
          (function buildConf (){
            // build `conf` object for the delight of existing preview code
            return {
              targetProject: {
                id: asyncData.link.identity,
                fullName: asyncData.link.displayName
              },
              credentials: {
                secret: asyncData.me.secret
              },
              config: {
                treelineURL: inputs.treelineApiUrl||'https://api.treeline.io'
              }
            };
          })(),
          [{/* ...? */}],
          next
        );
      }]

    }, function (err) {
      if (err) return exits.error(err);
      return exits.success();
    });




    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var path = require('path');
    var fs = require('fs');
    var fse = require('fs-extra');
    var exec = require('child_process').exec;

    function ensurePackageJson(cb) {
      // Check for existing package.json
      if (fs.existsSync(path.resolve(process.cwd(), "package.json"))) {
        return cb();
      }
      fse.outputJSON(path.resolve(process.cwd(), "package.json"), {
        name: conf.targetProject.fullName,
        version: "0.0.0"
      }, cb);
    }

    function ensureMachineRunner (cb) {
      // Check for existing node_machine install
      if (fs.existsSync(path.resolve(process.cwd(), "node_modules", "machine", "package.json"))) {
        return cb();
      }
      exec("npm install machine --save", {cwd: process.cwd()}, function(err, stdout) {
        console.log(stdout);
        cb(err);
      });
    }

    function ensureSailsHookMachines (cb) {
      // Check for existing sails-hook-machines install
      if (fs.existsSync(path.resolve(process.cwd(), "node_modules", "sails-hook-machines", "package.json"))) {
        return cb();
      }
      exec("npm install sails-hook-machines --save", {cwd: process.cwd()}, function(err, stdout) {
        console.log(stdout);
        cb(err);
      });
    }

  }

};
