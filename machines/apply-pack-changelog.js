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

    // var changedPack = inputs.changelog[0];
    var changedPack = GET_FAKE_CHANGELOG()[0];
    if (changedPack.verb !== 'set') {
      return exits.error('Invalid changelog: cannot be applied.  For the time being, machinepack changelogs should only use the "set" verb.  We got:\n'+util.inspect(inputs.changelog, {depth: null}) );
    }
    console.log(require('util').inspect(changedPack, {depth: null}));

    // For now, convert changelog into `packData` and use existing code
    // to generate the package.json file, the pack's machines, and its
    // Treeline-hosted machinepack dependencies.
    var packData = [];
    packData = packData.concat(changedPack.dependencyPacks);
    changedPack.definition.isMain = true;
    packData.push(changedPack.definition);


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




/**
 * [GET_FAKE_PACK_DATA description]
 */
function GET_FAKE_PACK_DATA(){

  var fakePackData = [ { _id: '459ab538-3c6a-4a0d-ad61-895bd6097c06_2.0.1',
    friendlyName: 'Http',
    description: 'Send an HTTP request.',
    author: 'balderdashy',
    license: '',
    version: '2.3.0',
    isMain: false,
    npmPackageName: 'machinepack-http',
    dependencies:
     [ { name: 'machine', semverRange: '^2.0.2' },
       { name: 'lodash', semverRange: '^2.4.1' },
       { name: 'request', semverRange: '^2.51.0' },
       { name: 'machinepack-urls', semverRange: '^2.0.0' } ],
    machines: [] },
  { _id: '0ccd2b47-a58e-4f8c-a3fd-d5a4ec77bfd5_4.3.0',
    friendlyName: 'Util',
    description: 'Utilities for everyday tasks with arrays, dictionaries, strings, etc.',
    author: 'mikemcneil',
    license: '',
    version: '5.1.0',
    isMain: false,
    npmPackageName: 'machinepack-util',
    dependencies:
     [ { name: 'machine', semverRange: '^4.0.0' },
       { name: 'lodash', semverRange: '^2.4.1' },
       { name: 'hat', semverRange: '0.0.3' },
       { name: 'object-hash', semverRange: '^0.5.0' } ],
    machines: [] },
  { _id: 'a8ddb9a2-a8f2-417b-b5b3-6feee5b2b142_1.0.3',
    friendlyName: 'Math',
    description: 'Harness the power of math.',
    author: 'mikermcneil',
    license: '',
    version: '1.2.0',
    isMain: false,
    npmPackageName: 'machinepack-math',
    dependencies:
     [ { name: 'lodash', semverRange: '^3.8.0' },
       { name: 'machine', semverRange: '^9.0.1' } ],
    machines: [] },
  { _id: 'pokemon',
    friendlyName: 'Pokemon',
    description: 'Fetch data about Pokémon, their moves, abilities, types, egg groups and much much more.',
    author: '',
    license: '',
    version: '0.0.0',
    isMain: true,
    npmPackageName: '',
    dependencies: [],
    machines:
     [ { identity: 'ListallPokemon',
         friendlyName: 'List Pokemon (raw)',
         description: 'List the name and resource_uri for every Pokémon.',
         extendedDescription: '',
         cacheable: false,
         environment: [],
         inputs: {},
         exits:
          { error: { friendlyName: 'error', void: true },
            badRequest:
             { friendlyName: 'badRequest',
               example:
                { status: 400,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            forbidden:
             { friendlyName: 'forbidden',
               example:
                { status: 403,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            unauthorized:
             { friendlyName: 'unauthorized',
               example:
                { status: 401,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            serverError:
             { friendlyName: 'serverError',
               example:
                { status: 503,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            requestFailed: { friendlyName: 'requestFailed', void: true },
            error2: { friendlyName: 'error2', void: true },
            couldNotParse: { friendlyName: 'couldNotParse', void: true },
            success:
             { friendlyName: 'success',
               example: { pokemon: [ { name: 'Bulbasaur', resource_uri: 'http://whoevencares.com' } ] } },
            notFound:
             { friendlyName: 'notFound',
               example:
                { status: 404,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } } },
         fn: '// Send HTTP request\nrequire(\'./459ab538-3c6a-4a0d-ad61-895bd6097c06_2.0.1\').sendHttpRequest({\n"url": "http://pokeapi.co/api/v1/pokedex/1/","method": "GET"\n}).exec({\n"error": function ( sendHTTPRequest ) { \nexits.error(sendHTTPRequest);\n},"notFound": function ( sendHTTPRequest ) { \nexits.notFound(sendHTTPRequest);\n},"badRequest": function ( sendHTTPRequest ) { \nexits.badRequest(sendHTTPRequest);\n},"forbidden": function ( sendHTTPRequest ) { \nexits.forbidden(sendHTTPRequest);\n},"unauthorized": function ( sendHTTPRequest ) { \nexits.unauthorized(sendHTTPRequest);\n},"serverError": function ( sendHTTPRequest ) { \nexits.serverError(sendHTTPRequest);\n},"requestFailed": function ( sendHTTPRequest ) { \nexits.requestFailed(sendHTTPRequest);\n},"success": function ( sendHTTPRequest ) { \n// Parse JSON\nrequire(\'./0ccd2b47-a58e-4f8c-a3fd-d5a4ec77bfd5_4.3.0\').parseJson({\n"json": (sendHTTPRequest && sendHTTPRequest.body),"schema": {pokemon: [{name: "Bulbasaur",resource_uri: "http://whoevencares.com"}]}\n}).exec({\n"error": function ( parseJSON ) { \nexits.error2(parseJSON);\n},"couldNotParse": function ( parseJSON ) { \nexits.couldNotParse(parseJSON);\n},"success": function ( parseJSON ) { \nexits.success(parseJSON);\n}});\n\n}});' },
       { identity: 'ListAllPokemon',
         friendlyName: 'List Pokemon',
         description: 'List basic information about every Pokemon.',
         extendedDescription: '',
         cacheable: false,
         environment: [ 'req', 'res', 'sails' ],
         inputs: {},
         exits:
          { error: { friendlyName: 'error', void: true },
            notFound:
             { friendlyName: 'notFound',
               example:
                { status: 404,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            badRequest:
             { friendlyName: 'badRequest',
               example:
                { status: 400,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            forbidden:
             { friendlyName: 'forbidden',
               example:
                { status: 403,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            unauthorized:
             { friendlyName: 'unauthorized',
               example:
                { status: 401,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            serverError:
             { friendlyName: 'serverError',
               example:
                { status: 503,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            requestFailed: { friendlyName: 'requestFailed', void: true },
            error2: { friendlyName: 'error2', void: true },
            couldNotParse: { friendlyName: 'couldNotParse', void: true },
            success:
             { friendlyName: 'success',
               example: { pokemon: [ { name: 'Bulbasaur', resource_uri: 'http://whoevencares.com' } ] } },
            error3: { friendlyName: 'error3', void: true },
            otherwise: { friendlyName: 'else', void: true },
            success2: { friendlyName: 'then', void: true },
            error32: { friendlyName: 'error32', void: true },
            otherwise2: { friendlyName: 'else2', void: true },
            success22: { friendlyName: 'then2', void: true },
            error4: { friendlyName: 'error4', void: true },
            success23: { friendlyName: 'success2', example: 4.2 },
            error5: { friendlyName: 'error5', void: true },
            success3: { friendlyName: 'then3', void: true },
            error6: { friendlyName: 'error6', void: true },
            success24: { friendlyName: 'then22', void: true } },
         fn: '// Send HTTP request\nrequire(\'./459ab538-3c6a-4a0d-ad61-895bd6097c06_2.0.1\').sendHttpRequest({\n"url": "http://pokeapi.co/api/v1/pokedex/1/","method": "GET"\n}).exec({\n"error": function ( sendHTTPRequest ) { \nexits.error(sendHTTPRequest);\n},"notFound": function ( sendHTTPRequest ) { \nexits.notFound(sendHTTPRequest);\n},"badRequest": function ( sendHTTPRequest ) { \nexits.badRequest(sendHTTPRequest);\n},"forbidden": function ( sendHTTPRequest ) { \nexits.forbidden(sendHTTPRequest);\n},"unauthorized": function ( sendHTTPRequest ) { \nexits.unauthorized(sendHTTPRequest);\n},"serverError": function ( sendHTTPRequest ) { \nexits.serverError(sendHTTPRequest);\n},"requestFailed": function ( sendHTTPRequest ) { \nexits.requestFailed(sendHTTPRequest);\n},"success": function ( sendHTTPRequest ) { \n// Parse JSON\nrequire(\'./0ccd2b47-a58e-4f8c-a3fd-d5a4ec77bfd5_4.3.0\').parseJson({\n"json": (sendHTTPRequest && sendHTTPRequest.body),"schema": {pokemon: [{name: "Bulbasaur",resource_uri: "http://whoevencares.com"}]}\n}).exec({\n"error": function ( parseJSON ) { \nexits.error2(parseJSON);\n},"couldNotParse": function ( parseJSON ) { \nexits.couldNotParse(parseJSON);\n},"success": function ( parseJSON ) { \nexits.success(parseJSON);\n}});\n\n}});' },
       { identity: 'Tackle',
         friendlyName: 'Tackle',
         description: 'Use bulbasaur\'s tackle attack.',
         extendedDescription: '',
         cacheable: false,
         environment: [ 'req', 'res', 'sails' ],
         inputs: {},
         exits:
          { error: { friendlyName: 'error', void: true },
            error2: { friendlyName: 'error2', void: true },
            badRequest:
             { friendlyName: 'badRequest',
               example:
                { status: 400,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            forbidden:
             { friendlyName: 'forbidden',
               example:
                { status: 403,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            unauthorized:
             { friendlyName: 'unauthorized',
               example:
                { status: 401,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            serverError:
             { friendlyName: 'serverError',
               example:
                { status: 503,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            requestFailed: { friendlyName: 'requestFailed', void: true },
            success:
             { friendlyName: 'then',
               example:
                { status: 201,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            error3: { friendlyName: 'error3', void: true },
            notFound:
             { friendlyName: 'notFound',
               example:
                { status: 404,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            badRequest2:
             { friendlyName: 'badRequest2',
               example:
                { status: 400,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            forbidden2:
             { friendlyName: 'forbidden2',
               example:
                { status: 403,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            unauthorized2:
             { friendlyName: 'unauthorized2',
               example:
                { status: 401,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            serverError2:
             { friendlyName: 'serverError2',
               example:
                { status: 503,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } },
            requestFailed2: { friendlyName: 'requestFailed2', void: true },
            success2:
             { friendlyName: 'then2',
               example:
                { status: 201,
                  headers: '{"Accepts":"application/json"}',
                  body: '[{"maybe some JSON": "like this"}]  (but could be any string)' } } },
         fn: '// Determine the amount of damage\nrequire(\'./a8ddb9a2-a8f2-417b-b5b3-6feee5b2b142_1.0.3\').add({}).exec({\n"error": function ( determineTheAmountOfDamage ) { \nexits.error(determineTheAmountOfDamage);\n},"success": function ( determineTheAmountOfDamage ) { \n// Decrement damage from bulbasaur\nrequire(\'./459ab538-3c6a-4a0d-ad61-895bd6097c06_2.0.1\').sendHttpRequest({\n"url": determineTheAmountOfDamage\n}).exec({\n"error": function ( decrementDamageFromBulbasaur ) { \nexits.error2(decrementDamageFromBulbasaur);\n},"notFound": function ( decrementDamageFromBulbasaur ) { \n// Create a bulbasaur w/ the appropriate amount of remaining HP\nrequire(\'./459ab538-3c6a-4a0d-ad61-895bd6097c06_2.0.1\').sendHttpRequest({\n"url": decrementDamageFromBulbasaur\n}).exec({\n"error": function ( createABulbasaurWTheAppropriateAmountOfRemainingHP ) { \nexits.error3(createABulbasaurWTheAppropriateAmountOfRemainingHP);\n},"notFound": function ( createABulbasaurWTheAppropriateAmountOfRemainingHP ) { \nexits.notFound(createABulbasaurWTheAppropriateAmountOfRemainingHP);\n},"badRequest": function ( createABulbasaurWTheAppropriateAmountOfRemainingHP ) { \nexits.badRequest2(createABulbasaurWTheAppropriateAmountOfRemainingHP);\n},"forbidden": function ( createABulbasaurWTheAppropriateAmountOfRemainingHP ) { \nexits.forbidden2(createABulbasaurWTheAppropriateAmountOfRemainingHP);\n},"unauthorized": function ( createABulbasaurWTheAppropriateAmountOfRemainingHP ) { \nexits.unauthorized2(createABulbasaurWTheAppropriateAmountOfRemainingHP);\n},"serverError": function ( createABulbasaurWTheAppropriateAmountOfRemainingHP ) { \nexits.serverError2(createABulbasaurWTheAppropriateAmountOfRemainingHP);\n},"requestFailed": function ( createABulbasaurWTheAppropriateAmountOfRemainingHP ) { \nexits.requestFailed2(createABulbasaurWTheAppropriateAmountOfRemainingHP);\n},"success": function ( createABulbasaurWTheAppropriateAmountOfRemainingHP ) { \nexits.success2(createABulbasaurWTheAppropriateAmountOfRemainingHP);\n}});\n\n},"badRequest": function ( decrementDamageFromBulbasaur ) { \nexits.badRequest(decrementDamageFromBulbasaur);\n},"forbidden": function ( decrementDamageFromBulbasaur ) { \nexits.forbidden(decrementDamageFromBulbasaur);\n},"unauthorized": function ( decrementDamageFromBulbasaur ) { \nexits.unauthorized(decrementDamageFromBulbasaur);\n},"serverError": function ( decrementDamageFromBulbasaur ) { \nexits.serverError(decrementDamageFromBulbasaur);\n},"requestFailed": function ( decrementDamageFromBulbasaur ) { \nexits.requestFailed(decrementDamageFromBulbasaur);\n},"success": function ( decrementDamageFromBulbasaur ) { \nexits.success(decrementDamageFromBulbasaur);\n}});\n\n}});' } ] } ];

  return fakePackData;
}


function GET_FAKE_CHANGELOG (){
  var _ = require('lodash');
  var fakeChangelog = [];

  var mainPack;
  var dependencyPacks = [];
  _.each(GET_FAKE_PACK_DATA(), function (pack){
    if (pack.isMain) {
      mainPack = pack;
    }
    else {
      dependencyPacks.push(pack);
    }
  });

  fakeChangelog.push({
    identity: mainPack._id,
    verb: 'set',
    definition: mainPack,
    dependencyPacks: dependencyPacks
  });

  return fakeChangelog;
}
