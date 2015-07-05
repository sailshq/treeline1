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


  fn: function (inputs, exits, env) {
    var util = require('util');
    var path = require('path');
    var _ = require('lodash');
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

    // Before going any further, we'll build a postinstall script that installs
    // Treeline dependencies, then inject it into the pack metadata.  This is so
    // that, when this pack is used as a dependency in a production setting
    // (i.e. without the use of the Treeline CLI tool) it will still fetch the
    // appropriate dependencies directly from Treeline.io.  See comments above
    // about the eventual plan to move to a "everything on NPM" model (the issue
    // right now is that we can't publish private packages on behalf of users who
    // don't have a paid NPM account, because they can't install them).

    // Use a separate lighter-weight module which is just the logic for installing treeline deps:
    changedPack.definition.postInstallScript = 'node ./node_modules/treeline-installer/bin/treeline-installer';

    // Ensure a dependency on `treeline-installer`
    // (use the same semver range as in OUR package.json file)
    if (!_.find(changedPack.definition.dependencies, {name: 'treeline-installer'})) {
      changedPack.definition.dependencies.push({ name: 'treeline-installer', semverRange: require('../package.json').dependencies['treeline-installer'] });
    }

    // Add a `treelineApiUrl` CLI opt if the current api url is different than the default.
    if (inputs.treelineApiUrl !== env.thisMachine().inputs.treelineApiUrl.defaultsTo) {
      changedPack.definition.postInstallScript += ' --treelineApiUrl=\''+inputs.treelineApiUrl+'\'';
    }


    // Now we apply changes to the main pack metadata and its machines.
    // This generates the pack folder and machines (as well as package.json
    // and other files) At the moment, we do this every time, no matter what
    // changes there were:
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

        // Install this pack's NPM dependencies
        // (this will ALSO trigger installing its Treeline dependencies,
        //  because of our postinstall script)
        NPM.installDependencies({
          dir: inputs.dir
        })
        .exec({
          error: exits.error,
          success: exits.success
        });

      }
    });

  },


};

