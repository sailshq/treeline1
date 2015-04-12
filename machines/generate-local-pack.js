module.exports = {


  friendlyName: 'Generate local pack',


  description: 'Generate a folder and files from the provided machinepack data.',


  extendedDescription: '',


  inputs: {

    destination: {
      description: 'Absolute path where the machinepack will be exported.',
      extendedDescription: 'Defaults to the machinepack\'s name (lowercased) resolved from the current working directory.  For example, if you\'ve cd\'d into your Desktop and you\'re exporting a machinepack with name "Foo", then this might default to "/Users/mikermcneil/Desktop/foo.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    packData: {
      description: 'The machinepack and machine metadata/code to generate from.',
      typeclass: 'dictionary'
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
    return exits.success();
  },



};
