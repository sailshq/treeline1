module.exports = {


  friendlyName: 'Install Treeline dependencies',


  description: 'Install Treeline pack dependencies for the specified pack.',


  inputs: {

    dir: {
      description: 'Path to the local machinepack where the dependencies should be installed.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
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
    var thisPack = require('../');

    // Ensure we have an absolute destination path.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    // First, look up this pack's id from its package.json file.
    // TODO

    // Hit Treeline.io to fetch and export the deep dependencies for this pack.
    // Because the packs are flattened, this includes nested dependencies as well
    // as top-level dependencies of this pack.
    var dependencyPacks = [];
    // TODO

    // Now loop over each of the "real" dependency packs and write them to disk.
    async.each(dependencyPacks, function(pack, next) {

      // TODO: move this to the api:
      ////////////////////////////////////////////////////////////////////////////////
      // // Lowercase the machine identities
      // packData.machines = _.map(packData.machines, function (machineDef){
      //   machineDef.identity = machineDef.identity.toLowerCase();
      //   return machineDef;
      // });
      // // (also ensure none of the machines now have duplicate identities-
      // //  if so, then remove them)
      // packData.machines = _.uniq(packData.machines, 'identity');
      ////////////////////////////////////////////////////////////////////////////////

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
  },



};
