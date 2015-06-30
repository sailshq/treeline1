module.exports = {


  friendlyName: 'Apply pack changelog',


  description: 'Apply a changelog of remote changes from treeline.io to the local machinepack.',


  inputs: {

    changelog: {
      friendlyName: 'Changelog',
      description: 'A set of changes to apply to this local machinepack.',
      example: [{}],
      required: true
    }

  },


  exits: {


  },


  fn: function (inputs,exits) {
    var util = require('util');
    var _ = require('lodash');


    // var EXAMPLE = [
    //   {
    //     identity: 'machinepack-baz',
    //     verb: 'set',
    //     // Note that there is NOT a nested `machines` changelog.
    //     // That's because we don't have any way of knowing currently
    //     // what changes need to be applied to make the local version
    //     // match the remote (i.e. local version could have all sorts of
    //     // changes we don't know about).
    //     definition: {
    //       friendlyName: 'Baz',
    //       machines: [{
    //         identity: 'foo-bar',
    //         // ...
    //       }],
    //       dependencies: [{}]
    //     },
    //   }
    // ];
    if (inputs.changelog.length === 0) {
      return exits.success();
    }

    var change = inputs.changelog[0];
    if (change.verb !== 'set') {
      return exits.error('Invalid changelog: cannot be applied.  For the time being, machinepack changelogs should only use the "set" verb.  We got:\n'+util.inspect(inputs.changelog, {depth: null}) );
    }

    // TODO: for now, convert changelog into `packData` and use existing code
    // to generate the pack and machines.
    var packData;

    // // Generate the pack folder and machines (as well as package.json and other files)
    // thisPack.generateLocalPack({
    //   destination: destinationPath,
    //   packData: _.find(packData, {isMain: true}),
    //   dependencyIdentifiers: _.pluck(_.where(packData, {isMain: false}), '_id'),
    //   force: inputs.force
    // }).exec({
    //   error: function (err){
    //     return exits.error(err);
    //   },
    //   success: function (){
    //     async.each(_.where(packData, {isMain: false}), function(pack, next) {
    //       thisPack.generateLocalDependency({
    //         destination: destinationPath,
    //         packData: pack,
    //         force: inputs.force
    //       }).exec({
    //         error: function (err){
    //           return next(err);
    //         },
    //         success: function (){
    //           next();
    //         }
    //       });
    //     }, function(err) {
    //       if (err) {
    //         return exits.error(err);
    //       }
    //       return exits.success({name: chosenPack.displayName, path: destinationPath});
    //     });
    //   }
    // });// </thisPack.generateLocalPack>


    return exits.success();

  },


};
