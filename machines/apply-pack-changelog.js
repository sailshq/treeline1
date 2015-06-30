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
    var async = require('async');
    var _ = require('lodash');
    var thisPack = require('../');


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
    //     },
    //     dependencyPacks: [{
    //       identity: 'machinepack-blah',
    //       // ...
    //     }]
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
      return exits.error('Invalid changelog: cannot be applied.  For the time being, machinepack changelogs should only use the "set" verb.  We got:\n'+util.inspect(inputs.changelog, {depth: null}) );
    }
    // console.log(require('util').inspect(changedPack, {depth: null}));

    // For now, convert changelog into `packData` and use existing code
    // to generate the package.json file, the pack's machines, and its
    // Treeline-hosted machinepack dependencies.
    var packData = [];
    packData = packData.concat(changedPack.dependencyPacks);
    changedPack.definition.isMain = true;
    packData.push(changedPack.definition);

    // packData example:
    // [{
    //   _id: 'bc231894d-194ab1-49284e9af-28401fbc1d',
    //   friendlyName: 'Foo',
    //   description: 'Node.js utilities for working with foos.',
    //   author: 'Marty McFly <marty@mcfly.com>',
    //   license: 'MIT',
    //   version: '0.5.17',
    //   isMain: true,
    //   npmPackageName: 'machinepack-do-stuff',
    //   dependencies: [ { name: 'lodash', semverRange: '^2.4.1' } ],
    //   machines: [{
    //     identity: 'do-stuff',
    //     friendlyName: 'Do stuff and things',
    //     description: 'Do stuff given other stuff.',
    //     extendedDescription: 'Do stuff to the stuff given the other stuff.  If the stuff doesn\'t get done the first time, try it again up to 50 times using an exponential backoff strategy.',
    //     cacheable: false,
    //     environment: ['req'],
    //     inputs: {}, //=> { foo: { friendlyName: 'Foo', example: 'bar' } }
    //     exits: {}, //=>{ error: { friendlyName: 'error', example: null } }
    //     fn: '/*the stringified machine fn here*/',
    //   }]
    // }]

    var destinationPath = process.cwd();

    // Generate the pack folder and machines (as well as package.json and other files)
    thisPack.generateLocalPack({
      destination: destinationPath,
      packData: _.find(packData, {isMain: true}),
      dependencyIdentifiers: _.pluck(_.where(packData, {isMain: false}), '_id'),
      force: true
    }).exec({
      error: function (err){
        return exits.error(err);
      },
      success: function (){

        // Generate machinepack dependencies.
        async.each(_.where(packData, {isMain: false}), function(pack, next) {
          thisPack.generateLocalDependency({
            destination: destinationPath,
            packData: pack,
            force: true
          }).exec({
            error: function (err){
              return next(err);
            },
            success: function (){
              next();
            }
          });// </thisPack.generateLocalDependency>
        }, function(err) {
          if (err) {
            return exits.error(err);
          }
          return exits.success();
        }); // </async.each>
      }
    });// </thisPack.generateLocalPack>


  },


};

