#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Preview app',


  description: '',


  inputs: {

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
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

    return exits.success();

    // async.auto({

    //   project: function (next){
    //     thisPack.readLinkfile().exec({
    //       error: next,
    //       success: function (project){
    //         next(null, project);
    //       }
    //     });
    //   },

    //   owner: function (next){
    //     thisPack.readKeychain().exec({
    //       error: next,
    //       success: function (owner){
    //         next(null, owner);
    //       }
    //     });
    //   }
    // }, function afterwards(err){
    //   if (err) return exits(err);


    //   var BASE_URL = 'http://treeline.io/';
    //   var url = Urls.sanitize({
    //     url: BASE_URL+'/'+owner.username+'/'+project.identity
    //   }).execSync();

    //   thisPack.browseToUrl({
    //     url: url
    //   }).exec({
    //     error: exits.error,
    //     success: function() {
    //       return exits.success(url);
    //     }
    //   });

    // });
  }


}, {

  notLinked: function (){
    var chalk = require('chalk');
    console.log('The current directory is '+ chalk.yellow('not linked') +' to Treeline.');
  }

});
