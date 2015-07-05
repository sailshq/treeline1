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
    var path = require('path');
    var rttc = require('rttc');
    var LocalMachinepacks = require('machinepack-localmachinepacks');

    // Ensure we have an absolute destination path.
    inputs.dir = path.resolve(inputs.dir);

    // Ensure packData is valid using an example schema.
    inputs.packData = rttc.coerce({
      id: 'string',
      npmPackageName: 'string',
      version: 'string',
      friendlyName: 'string',
      description: 'string',
      author: 'string',
      license: 'string',
      dependencies: [ { name: 'string', semverRange: 'string' } ]
    }, inputs.packData);

    // If version is invalid, bail out w/ an error.
    if (!inputs.packData.version) {
      return exits.error(new Error('Invalid `version`. Should be a semantic version string (e.g. "4.2.31")'));
    }

    // Build some code for the index.js file that will require
    // the correct version of the dependency.
    var rawVersionSpecificPkgName = inputs.packData.npmPackageName + '_' + inputs.packData.version;
    inputs.packData.indexJsCode = '// This is an alias for the specific version of the machinepack.\nmodule.exports = require(\''+rawVersionSpecificPkgName+'\');\n';

    // Finally, write the pack to disk.
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
