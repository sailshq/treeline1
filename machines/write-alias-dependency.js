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

    requireStr: {
      description: 'A string to use in the `require()` in the generated index.js file.',
      extendedDescription: 'If omitted, will default to a portamento of the npmPackageName and version provided in `packData`.',
      example: '../machinepack-foo_3.1.415127'
    }

  },


  fn: function (inputs,exits) {
    var path = require('path');
    var rttc = require('rttc');
    var LocalMachinepacks = require('machinepack-localmachinepacks');

    // Ensure we have an absolute destination path.
    inputs.dir = path.resolve(inputs.dir);

    // Ensure packData is valid using an example schema.
    // (note that we explicitly exclude certain properties-- particularly `machines` and `dependencies`)
    inputs.packData = rttc.coerce({
      id: 'string',
      npmPackageName: 'string',
      version: 'string',
      friendlyName: 'string',
      description: 'string',
      author: 'string',
      license: 'string'
    }, inputs.packData);

    // If version is invalid, bail out w/ an error.
    if (!inputs.packData.version) {
      return exits.error(new Error('Invalid `version`. Should be a semantic version string (e.g. "4.2.31")'));
    }

    // Build some code for the index.js file that will require
    // the correct version of the dependency.
    // If `requireStr` was not provided, default it to a portamento
    // of the npm package name & version string.
    inputs.requireStr = inputs.requireStr || (inputs.packData.npmPackageName + '_' + inputs.packData.version);
    inputs.packData.indexJsCode = '// This is an alias for the specific version of the machinepack.\nmodule.exports = require(\''+inputs.requireStr+'\');\n';

    // Append some text to the description explaining this is just an alias, and not the real pack.
    inputs.packData.description = inputs.packData.description+'(This is just an alias that requires a specific version of this machinepack, which is located elsewhere. See index.js if you\'re curious.)';

    // Finally, write the pack to disk.
    LocalMachinepacks.writePack({
      destination: inputs.dir,
      packData: inputs.packData,
      force: true,
      // We disable `ensureMachineDep` here to avoid needlessly installing the
      // `machine` dependency from NPM in this pack-- it will never be used and
      // would just be a waste of time.
      ensureMachineDep: false,
      // TODO: consider also excluding other info which might be confusing
      // (e.g. the empty `machinepack.machines` array included in the exported package.json file)
    }).exec({
      error: exits.error,
      success: function (){
        return exits.success();
      }
    });// </LocalMachinepacks.writePack>

  },



};
