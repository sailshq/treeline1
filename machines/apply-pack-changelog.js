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
    }

  },


  exits: {


  },


  fn: function (inputs,exits) {
    var util = require('util');
    var path = require('path');
    var async = require('async');
    var _ = require('lodash');
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
    //         id: 'themachinereleaseid',
    //         identity: 'mikermcneil/machinepack-stuffandthings',
    //         version: '4.2.5'
    //       }]
    //     }
    //   }
    // ];

    // For now, notice that we also include `packDependencies`, which consists
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
    // (TODO: do this elsewhere ^^)

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
        // because flattening.

        // Gather up the ids of all of the dependencies that changed:
        // (for now this includes all of them)
        var changedDependencies = changedPack.definition.treelineDependencies;

        // For each of this pack's treeline dependencies which are not "real",
        // write stub packs to disk that simply require the appropriate version.
        // TODO

        // Extrapolate the following into a separate machine:

        // Hit Treeline.io to fetch all of the "real" dependency packs
        // (i.e. the ones that are real releases) and get their machine code.
        var dependencyPacks = [];
        // TODO

        // Now loop over each of the "real" dependency packs and write them to disk.
        async.each(dependencyPacks, function(pack, next) {

          // Write the exported pack dependency to disk
          thisPack.generateLocalDependency({
            destination: inputs.dir,
            packData: pack,
            force: true
          }).exec({
            error: function (err){
              return next(err);
            },
            success: function (){
              // For each of this pack dependency's treeline dependencies which are not "real",
              // write stub packs to disk that simply require the appropriate version.
              // TODO

              return next();
            }
          });// </thisPack.generateLocalDependency>
        }, function(err) {
          if (err) {
            return exits.error(err);
          }
          return exits.success();
        }); // </async.each>

      }
    });

  },


};

