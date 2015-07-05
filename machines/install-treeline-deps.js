module.exports = {


  friendlyName: 'Install Treeline dependencies',


  description: 'Install Treeline pack dependencies for the specified pack.',


  inputs: {

    dir: {
      description: 'Path to the local machinepack where the dependencies should be installed.',
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

    success: {
      description: 'Done.',
    },

  },


  fn: function (inputs,exits) {
    var path = require('path');
    var async = require('async');
    var _ = require('lodash');
    var LocalMachinepacks = require('machinepack-localmachinepacks');
    var Http = require('machinepack-http');
    var thisPack = require('../');

    // Ensure we have an absolute destination path.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    // For each of this pack's shallow dependencies, write stub packs to disk
    // that simply require the appropriate version.
    // TODO

    // First, look up this pack's id from its package.json file.
    // TODO
    var packId;

    // And look up user credentials from a keychain file
    // (but if no keychain is found, try anyway-- this might be an open-source pack)
    // TODO
    var secret;

    // Hit Treeline.io to fetch and export the deep dependencies for this pack.
    // Because the packs are flattened, this includes nested dependencies as well
    // as top-level dependencies of this pack.
    Http.sendHttpRequest({
      method: 'get',
      baseUrl: inputs.treelineApiUrl,
      url: '/api/v1/'+packId+'/dependencies',
      headers: {
       'x-auth': secret
      },
    }).exec({
      error: exits.error,
      success: function (exportedDependencyPacks){

        // For each of the pack's "shallow" (version-agnostic) dependencies, write
        // stub packs to disk that simply require the appropriate version.
        // TODO

        // Now loop over each of the "real" (deep) dependency packs and write
        // the exported versions of them to disk.
        async.each(exportedDependencyPacks, function(pack, next) {

          // Write the exported pack dependency to disk
          // TODO: write this in the node_modules folder once the relevant updates
          // have been made in the compiler
          LocalMachinepacks.writePack({
            destination: path.resolve(inputs.destination,'machines',pack.id),
            packData: pack,
            force: true
          }).exec({
            error: function (err){
              return next(err);
            },
            success: function (){
              // For each of this dependency's treeline dependencies, write
              // stub packs to disk that simply require the appropriate version.
              // TODO

              return next();
            }
          });// </write treeline dependency to local disk>
        }, function (err){
          if (err) {
            return exits.error(err);
          }
          return exits.success();
        });
      }
    });

  },


};
