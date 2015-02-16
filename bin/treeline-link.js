#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Link',


  description: 'Link the current directory to an app or machinepack in Treeline.',


  inputs: {

    identity: {
      description: 'The identity (i.e. slug) of the machinepack or app to link',
      example: 'my-cool-app'
    },

    baseUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io'
    }

  },

  exits: {

    success: {
      example: 'mikermcneil/my-cool-app'
    }

  },


  fn: function (inputs, exits){

    var _ = require('lodash');
    var Prompts = require('machinepack-prompts');
    var thisPack = require('../');


    var appToLink = {
      identity: inputs.identity
    };

    (function (next){

      // If identity was supplied, we don't need to show a prompt, but we will eventually
      // need to fetch more information about the app.  For now, we proceed.
      if (appToLink.identity) {
        return next();
      }

      // Look up the account secret
      thisPack.readKeychain().exec({
        error: function (err){ return next(err); },
        success: function (keychain) {

          // Fetch list of apps, then prompt user to choose one:
          thisPack.listApps({
            secret: keychain.secret,
            baseUrl: inputs.baseUrl
          }).exec({
            error: function (err){ return next(err); },
            success: function (apps){

              // Prompt the command-line user to make a choice from a list of options.
              Prompts.select({
                choices: _.reduce(apps, function (memo, app) {
                  memo.push({
                    name: app.displayName,
                    value: app.identity
                  });
                  return memo;
                }, []),
                message: 'Which app would you like to link with the current directory?'
              }).exec({
                // An unexpected error occurred.
                error: function(err) {
                  next(err);
                },
                // OK.
                success: function(choice) {
                  appToLink.identity = choice;
                  appToLink.displayName = (_.find(apps, {identity: appToLink.identity}) || appToLink).displayName || appToLink.identity;
                  next();
                },
              });

            }
          });
        }
      });

    })(function afterwards(err){
      if (err) return exits(err);

      // Get more info about the app (i.e. the owner)
      // TODO
      var owner = ''; // e.g. 'mikermcneil';

      thisPack.writeLinkfile({
        identity: appToLink.identity,
        displayName: appToLink.displayName, // TODO: look this up when identity is provided manually w/o listing apps
        type: 'app',
        owner: owner  // TODO: get this
      }).exec({
        error: function (err){
          return exits.error(err);
        },
        success: function (){
          return exits.success(owner + '/' + appToLink.identity);
        }
      });

    });


  }


}, {

  success: function (slug){
    var chalk = require('chalk');
    console.log();
    console.log(chalk.gray('(created '+chalk.bold('treeline.json')+')'));
    console.log('Current directory now linked to %s on Treeline.', chalk.cyan(slug));
  }

});
