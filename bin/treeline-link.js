#!/usr/bin/env node


require('../standalone/build-script')({


  friendlyName: 'Link',


  description: 'Link the current directory to an app or machinepack in Treeline.',


  inputs: {

    identity: {
      description: 'The identity (i.e. slug) of the machinepack or app to link',
      example: 'my-cool-app'
    }

  },


  fn: function (inputs, exits){

    var thisPack = require('../');

    var identity = inputs.identity;

    (function (next){
      if (identity) {
        return next();
      }

      // Prompt to choose an app
      // TODO:
      return next(new Error('not implemented yet'));

    })(function afterwards(err){
      if (err) return exits.error(err);

      thisPack.writeLinkfile({
        identity: identity,
        displayName: identity, // TODO: get this
        type: 'app',
        owner: 'mikermcneil'  // TODO: get this
      }).exec({
        error: function (err){
          console.error('ER',err);
          return exits.error(err);
        },
        success: function (){
          return exits.success();
        }
      });

    });


  }


});
