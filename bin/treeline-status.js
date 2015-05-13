#!/usr/bin/env node


require('machine-as-script')({


  friendlyName: 'treeline status',


  description: 'Get account status and determine the Treeline app linked to from the current directory.',


  exits: {
    error: {},
    success: {
      example: {
        me: {
          username: 'mikermcneil',
          secret: '29f559ae-3bec-4d0a-8458-1f4e32a72407'
        },
        link: {
          identity: 'my-cool-app',
          displayName: 'My Cool App',
          type: 'app',
          owner: 'mikermcneil'
        }
      }
    },
  },


  fn: function (inputs, exits){
    var thisPack = require('../');


    // This is the object we'll be building up below.
    var statusReport = {
      me:{},
      link:{}
    };

    (function getAccount(next){
      thisPack.readKeychain().exec({
        error: function (err) {
          return next(err);
        },
        doesNotExist: function (){
          return next();
        },
        success: function (account){
          statusReport.me = account;
          return next();
        }
      });
    })(function (err) {
      if (err) return exits.error(err);

      (function getLinkedProject(next){
        thisPack.readLinkfile().exec({
          error: function (err) {
            if (err) return next(err);
          },
          doesNotExist: function (){
            return next();
          },
          success: function (linkData){
            statusReport.link = linkData;
            return next();
          },
        });
      })(function (err){
        if (err) return exits.error(err);
        return exits.success(statusReport);
      });

    });

  }


}).exec({

  success: function (statusReport){
    var chalk = require('chalk');
    console.log();

    if (statusReport.me.username) {
      console.log('This computer is logged in as %s.', chalk.cyan(statusReport.me.username));
    }
    else {
      console.log('This computer is '+chalk.yellow('not logged in')+' to Treeline.');
    }

    if (statusReport.link.identity) {
      console.log('Current directory is linked to %s.', chalk.cyan(statusReport.link.owner + '/' + statusReport.link.identity));
    }
    else {
      console.log('Current directory is ' + chalk.yellow('not linked') + ' to Treeline.');
    }
  }

});
