module.exports = {


  friendlyName: 'Start interactive development session (machinepack)',


  description: 'Preview the machinepack in the current directory, streaming down updated code as changes are made on https://treeline.io.',


  extendedDescription: 'Note that this will run the `scribe` tool as a local server (http://localhost:1337).',


  inputs: {

    onAuthenticated: {
      description: 'An optional notifier function that will be called when authentication is complete.',
      example: '->',
      defaultsTo: function (){}
    },

    onConnected: {
      description: 'An optional notifier function that will be called when a connection is established with Treeline.io and this pack is being initially synchronized with the server.',
      example: '->',
      defaultsTo: function (){}
    },

    onSyncError: {
      description: 'An optional notifier function that will be called when Treeline attempts to sync remote changes to the local pack, but it fails.',
      example: '->',
      defaultsTo: function (){}
    },

    onSyncSuccess: {
      description: 'An optional notifier function that will be called when Treeline attempts to sync remote changes to the local pack and it works.',
      example: '->',
      defaultsTo: function (){}
    },

    onPreviewServerLifted: {
      description: 'An optional notifier function that will be called when the preview server has successfully lifted and can be safely accessed.',
      example: '->',
      defaultsTo: function (){}
    },

    onSocketDisconnect: {
      description: 'An optional notifier function that will be called if/when the remote connection with http://treeline.io is lost (and as the local Treeline client attempts to reconnect).',
      example: '->',
      defaultsTo: function (){}
    },

    onFlushError: {
      description: 'An optional notifier function that will be called if/when the router of the locally-running app cannot be flushed.',
      example: '->',
      defaultsTo: function (){}
    },

    localPort: {
      description: 'The local port to run the `scribe` utility on.  Defaults to 1337.',
      example: 1337,
      defaultsTo: 1337
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    }

  },


  exits: {

    error: {
      description: 'Unexpected error occurred.'
    },

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
    },

    noMachinepacks: {
      description: 'No machinepacks belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    forbidden: {
      description: 'Unrecognized username/password combination.',
      extendedDescription: 'Please try again or visit http://treeline.io to reset your password or locate your username.'
    },

    requestFailed: {
      description: 'Could not communicate with Treeline.io -- are you connected to the internet?'
    },

    success: {
      description: 'The success exit should never be triggered.'
    },

  },


  fn: function (inputs, exits){

    var async = require('async');
    var _ = require('lodash');
    var Scribe = require('test-scribe');
    var Http = require('machinepack-http');
    var LocalMachinepacks = require('machinepack-localmachinepacks');
    var thisPack = require('../');
    var getSocketAndConnect = require('../standalone/sails-client');


    // The path to pack is always the current working directory
    // (for the time being, at least)
    var pathToPack = process.cwd();

    // var errMsg = '';
    // errMsg += '\n';
    // errMsg += 'Sorry-- interactive pack preview is not implemented yet.';
    // errMsg += '\n';
    // errMsg +=  'But we\'re working on it!  If you\'re curious, keep an eye on the repo for updates:';
    // errMsg += '\n';
    // errMsg += 'http://github.com/treelinehq/treeline';
    // return exits.error(errMsg);



    // Now simultaneously:
    //  • lift the preview server
    //  • synchronize local pack files w/ http://treeline.io
    async.parallel([
      function(next){
        // Lift the `scribe` utility as a sails server running on
        // a configurable local port.
        Scribe({
          pathToPack: pathToPack,
          port: inputs.localPort
        }, function (err, localScribeApp) {
          if (err) {
            // Failed to start scribe.
            return next(err);
          }
          // Trigger optional notifier function.
          inputs.onPreviewServerLifted('http://localhost:'+inputs.localPort);
          return next();
        });
      },
      function(next){

        thisPack.loginIfNecessary({
          treelineApiUrl: inputs.treelineApiUrl
        }).exec({
          error: function (err) {
            return next(err);
          },
          success: function (me) {
            thisPack.linkIfNecessary({
              type: 'machinepack',
              treelineApiUrl: inputs.treelineApiUrl
            }).exec({
              error: function (err) {
                return next(err);
              },
              success: function (linkedProject) {
                if (linkedProject.type !== 'machinepack') {
                  return next.error('The project in this directory is not a machinepack.  Maybe try `treeline preview app` instead?');
                }

                // Trigger optional notifier function.
                inputs.onAuthenticated();

                // Read local pack and compute hash of the meaningful information.
                LocalMachinepacks.getSignature({
                  dir: pathToPack
                }).exec({
                  error: next,
                  success: function (packSignature) {

                    // Now we'll start up a synchronized development session by
                    // listening for changes from Treeline by first connecting a socket,
                    // then sending a GET request to subscribe to this particular pack.
                    // With that request, send hash of local pack to treeline.io, requesting
                    // an update if anything has changed (note that this will also subscribe
                    // our socket to future changes)
                    getSocketAndConnect({
                      baseUrl: inputs.treelineApiUrl
                    }, function (err, socket) {
                      if (err) {
                        return next(err);
                      }

                      // Trigger optional notifier function.
                      inputs.onConnected();

                      socket.request({
                        method: 'get',
                        // TODO: plug in the real URL and headers here
                        url: '/api/v1/machine-packs/rachaelshaw',
                        headers: { 'x-profile': 'rachaelshaw' },
                        params: {
                          // Send the hash strings
                          packHash: packSignature.packHash,
                          machineHashes: packSignature.machineHashes
                        }
                      }, function serverResponded (body, JWR) {
                        // console.log('Sails responded with: ', body); console.log('with headers: ', JWR.headers); console.log('and with status code: ', JWR.statusCode);
                        // console.log('JWR.error???',JWR.error);
                        if (JWR.error) {
                          // If initial pack subscription fails, kill the scribe server
                          // and stop listening to changes
                          return next(JWR.error);
                        }

                        // Fake machinepack changelog:
                        body = GET_FAKE_CHANGELOG();
                        // (TODO: remove this)

                        // Now subscribed.

                        // treeline.io will respond with a changelog, which may or may not be
                        // empty.  So we immediately apply it to our local pack on disk.
                        thisPack.syncRemoteChanges({
                          type: 'machinepack',
                          changelog: body,
                          onSyncSuccess: inputs.onSyncSuccess,
                          localPort: inputs.localPort
                        }).exec({
                          // If the initial sync or flush in scribe fails, then
                          // give up with an error msg.
                          error: function (err) {
                            return next(err);
                          },
                          success: function (){
                            // Initial sync complete
                            return next();
                          },
                        });

                      });

                      // If treeline.io says something changed, apply the changelog
                      // it provides to our local pack on disk.
                      socket.on('pack:changed', function (changelog){

                        thisPack.syncRemoteChanges({
                          type: 'machinepack',
                          changelog: changelog,
                          onSyncSuccess: inputs.onSyncSuccess,
                          localPort: inputs.localPort
                        }).exec({
                          // If applying a pack changelog to the local machinepack
                          // fails, then trigger the `onSyncError` notifier function.
                          error: function (err){
                            inputs.onSyncError(err);
                          },
                          // If reloading the pack in scribe fails, then trigger the
                          // `onFlushError` notifier function.
                          couldNotFlush: function (err){
                            inputs.onFlushError(err);
                          },
                          success: function (){ /* everything is hunky dory */ },
                        });
                      });

                      // Trigger `onSocketDisconnect` if the connection to treeline.io is broken
                      socket.on('disconnect', function() {
                        inputs.onSocketDisconnect();
                      });

                      // If anything goes horribly wrong or the process is stopped manually w/ <CTRL+C>,
                      // then ensure we:
                      //  • stop listening for changes
                      //  • kill the local server running `scribe`
                      //
                      // TODO
                      // (this is happening already in almost every case thanks to the `process.exit(1)`
                      //  we're calling in `bin/treeline-preview`. But we should make doubly sure.)

                    });
                  }
                });
              }
            });
          }
        });
      },
    ], function afterwards(err) {
      if (err) {
        return exits(err);
      }

    });

  }

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
