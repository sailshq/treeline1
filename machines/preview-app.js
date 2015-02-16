module.exports = {


  friendlyName: 'Preview app',


  description: '',


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

};
