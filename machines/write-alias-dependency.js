module.exports = {


  friendlyName: 'Write alias dependency',


  description: 'Write a machinepack to disk as a dependency- but just use it to alias another pack.',


  inputs: {

    dir: {
      description: 'Path where the alias machinepack should be written.',
      extendedDescription: 'If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo',
      required: true
    },

    packData: {
      description: 'The basic metadata for the machinepack (but without its machines).',
      example: {},
      required: true
    },

  },


  fn: function (inputs,exits) {
    var LocalMachinepacks = require('machinepack-localmachinepacks');

    // Ensure we have an absolute destination path.
    inputs.dir = path.resolve(inputs.dir);

    // Ensure packData is valid using an example schema.
    inputs.packData = rttc.coerce(rttc.infer({
      friendlyName: 'Foo',
      description: 'Node.js utilities for working with foos.',
      author: 'Marty McFly <marty@mcfly.com>',
      license: 'MIT',
      id: 'marty/machinepack-do-stuff',
      npmPackageName: '@treelinehq/marty/machinepack-do-stuff',
      dependencies: [ { name: 'lodash', semverRange: '^2.4.1' } ]
    }), inputs.packData);

    LocalMachinepacks.writePack({
      destination: inputs.dir,
      packData: inputs.packData,
      force: true
    }).exec({
      error: exits.error,
      success: function (){
        return exits.success();
      }
    });// </LocalMachinepacks.writePack>

  },



};
