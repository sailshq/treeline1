module.exports = {


  friendlyName: 'Apply pack changelog',


  description: 'Apply a changelog of remote changes from treeline.io to the local machinepack.',


  inputs: {

    changelog: {
      friendlyName: 'Changelog',
      description: 'A set of changes to apply to this local machinepack.',
      example: [{}],
      required: true
    },

    dir: {
      description: 'Path to the local machinepack where the changelog should be applied.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    }

  },


  exits: {


  },


  fn: function (inputs,exits) {
    var util = require('util');
    var path = require('path');
    var LocalMachinepacks = require('machinepack-localmachinepacks');
    var thisPack = require('../');

    // Ensure we have an absolute destination path.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    // Note that there is NOT a nested `machines` (aka "library") changelog.
    // That's because we don't have any way of knowing currently
    // what changes need to be applied to make the local version
    // match the remote (i.e. local version could have all sorts of
    // changes we don't know about).
    //
    // Over time, we can add a more granular changelog as a separate
    // key (i.e. not `definition`).

    // var EXAMPLE = [
    //   {
    //     identity: 'machinepack-baz',
    //     verb: 'set',
    //     definition: {
    //       friendlyName: 'Baz',
    //       machines: [{
    //         identity: 'foo-bar',
    //         // ...
    //       }],
    //       dependencies: [{}],
    //       treelineDependencies: [{
    //         id: 'mikermcneil/machinepack-stuffandthings',
    //         version: '4.2.5'
    //       }]
    //     }
    //   }
    // ];

    // For now, notice that we also include `treelineDependencies`, which consists
    // of other Treeline-hosted machinepacks which this pack depends upon.
    // TODO: use NPM instead

    if (inputs.changelog.length === 0) {
      return exits.success();
    }

    var changedPack = inputs.changelog[0];
    if (changedPack.verb !== 'set') {
      return exits.error(new Error('Invalid changelog: cannot be applied.  For the time being, machinepack changelogs should only use the "set" verb.  We got:\n'+util.inspect(inputs.changelog, {depth: null}) ));
    }
    // Use the `identity` as the npm package name if no package name is provided:
    changedPack.definition.npmPackageName = changedPack.definition.npmPackageName || changedPack.identity;
    // (TODO: make it so we don't have to do this here-- there should either ALWAYS be an `npmPackageName` or NEVER ^^)

    // First, we apply changes to the main pack metadata and its machines.
    // For now we do this every time, no matter what changes we saw:
    // Generate the pack folder and machines (as well as package.json and other files)
    LocalMachinepacks.writePack({
      destination: inputs.dir,
      packData: changedPack.definition,
      force: true
    }).exec({
      error: exits.error,
      success: function (){

        // If any of the pack's Treeline dependencies changed, we also need to
        // re-export those packs.  But we only need to do this one level deep,
        // because flattening.  For the time being, we re-export ALL dependencies.

        // Now install actual Treeline dependencies
        // (fetch from treeline.io and write to local disk)
        thisPack.installTreelineDeps({
          dir: inputs.dir,
          treelineApiUrl: inputs.treelineApiUrl
        }).exec({
          error: function(err) {
            return exits.error(err);
          },
          success: function (){
            return exits.success();
          }
        });
      }
    });

  },


};

