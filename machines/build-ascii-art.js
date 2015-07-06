module.exports = {


  friendlyName: 'Build ASCII art',


  description: 'Build a string that can be logged to draw the Treeline logo.',


  cacheable: false,


  sync: false,


  inputs: {

  },


  exits: {

    success: {
      variableName: 'result',
      description: 'Done.',
    },

  },


  fn: function (inputs,exits) {
    return exits.success();
  },



};
