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


  fn: function (inputs,exits) {
    var util = require('util');
    var path = require('path');
    var async = require('async');
    var LocalMachinepacks = require('machinepack-localmachinepacks');
    var NPM = require('machinepack-npm');
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

    // For now, notice that we also include `treelineDependencies`, which consists
    // of other Treeline-hosted machinepacks which this pack depends upon. Eventually,
    // we can use NPM for this (when there is support for organizations)

    if (inputs.changelog.length === 0) {
      return exits.success();
    }

    var changedPack = inputs.changelog[0];
    if (changedPack.verb !== 'set') {
      return exits.error(new Error('Invalid changelog: cannot be applied.  For the time being, machinepack changelogs should only use the "set" verb.  We got:\n'+util.inspect(inputs.changelog, {depth: null}) ));
    }

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

        async.parallel([

          // Install this pack's NPM dependencies
          function (doneInstallingNPMDeps){
            NPM.installDependencies({
              dir: path.join(inputs.dir)
            })
            .exec(doneInstallingNPMDeps);
          },

          // If any of the pack's Treeline dependencies changed, we also need to
          // re-export those packs.  But we only need to do this one level deep,
          // because flattening.  For the time being, we re-export ALL dependencies.
          //
          // Now install actual Treeline dependencies
          // (fetch from treeline.io and write to local disk)
          function (doneInstallingTreelineDeps){
            thisPack.installTreelineDeps({
              dir: inputs.dir,
              treelineApiUrl: inputs.treelineApiUrl
            }).exec(doneInstallingTreelineDeps);
          }
        ], function afterwards(err){
          if (err) {
            return exits.error(err);
          }
          return exits.success();
        });//</async.parallel>
      }
    });

  },


};

