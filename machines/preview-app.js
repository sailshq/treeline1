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

    noApps: {
      description: 'No apps belong to the account associated with this computer.',
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
      description: 'Done.'
    },

  },


  fn: function (inputs, exits){

    var util = require('util');
    var async = require('async');
    var debug = require('debug')('treeline');
    var Urls = require('machinepack-urls');
    var thisPack = require('../');
    var npm = require('machinepack-npm');
    var path = require('path');
    var chalk = require('chalk');
    async.auto({

      // Make sure the treeline API is alive
      pingServer: function(next) {
        thisPack.pingServer({url: inputs.treelineApiUrl  || process.env.TREELINE_API_URL || 'https://api.treeline.io'}).exec({
          success: function (){
            return next();
          },
          noResponse: exits.requestFailed
        });
      },

      checkForUpdates: function(next) {
        npm.getPackageJson({
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
              var latestPackageJson = npm.parsePackageJson({
                json: packageJsonString,
              }).execSync();
              // Get our own package.json
              var ourPackageJson = require(path.resolve(__dirname, "..", "package.json"));
              // If ours doesn't match the latest, show a helpful reminder
              if (ourPackageJson.version !== latestPackageJson.version) {
                console.log(chalk.bgYellow("A new version of Treeline (v " + latestPackageJson.version + ") is available!  Run", chalk.red("npm install -g treeline") + " to update."));
              }
            }
            catch (e) {
              // Don't worry about errors in the above; we'll just
              // try again next time.
            }
            next();
          },
        });
      },

      // Get login credentials
      me: ['checkForUpdates', function (next){
        thisPack.readKeychain().exec({
          error: function (err) {
            return next(err);
          },
          doesNotExist: function (){
            thisPack.login({
              treelineApiUrl: inputs.treelineApiUrl || process.env.TREELINE_API_URL || 'https://api.treeline.io'
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
      }],

      // Figure out which project to lift
      link: ['me', function (next){
        thisPack.readLinkfile().exec({
          error: function (err) {
            if (err) return next(err);
          },
          doesNotExist: function (){
            thisPack.linkApp({
              treelineApiUrl: inputs.treelineApiUrl || process.env.TREELINE_API_URL || 'https://api.treeline.io'
            }).exec({
              error: next,
              noApps: function (output){
                return next({exit: 'noApps', output: output});
              },
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
            var conf = {
              targetProject: {
                id: asyncData.link.id,
                fullName: asyncData.link.displayName
              },
              credentials: {
                secret: asyncData.me.secret
              },
              config: {
                treelineURL: inputs.treelineApiUrl || process.env.TREELINE_API_URL ||'https://api.treeline.io'
              }
            };
            debug('Will connect using:',conf);

            // build `conf` object for the delight of existing preview code
            return conf;
          })(),
          [{/* ...? */}],
          next
        );
      }]

    }, function (err) {
      if (err) {
        if (err.exit === 'noApps'){
          return exits.noApps(err.output);
        }
        return exits(err);
      }
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


    var fs = require('fs');
    var fse = require('fs-extra');
    var exec = require('child_process').exec;

    function ensurePackageJson(cb, results) {
      // Check for existing package.json
      if (fs.existsSync(path.resolve(process.cwd(), "package.json"))) {
        return cb();
      }
      fse.outputJSON(path.resolve(process.cwd(), "package.json"), {
        name: results.link.identity,
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
