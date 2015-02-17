module.exports = {


  friendlyName: 'New app',


  description: 'Generate a new Sails app in a new directory of the specified name.',


  extendedDescription: '',


  inputs: {

    name: {
      description: 'The name of the new app to generate.',
      example: 'pencil-pals',
      required: true
    }

  },


  defaultExit: 'success',


  exits: {

    error: {
      description: 'Unexpected error occurred.',
    },

    success: {
      description: 'Done.',
    },

  },


  fn: function (inputs,exits) {
    var sailsgen = require('sails-generate');

    var dir = process.cwd();

    sailsgen({
      generatorType: 'new',
      rootPath: dir
    }, function (err){
      if (err) return exits.error(err);

      return exits.success();
    });

  },



};
