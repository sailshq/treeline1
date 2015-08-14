module.exports = {


  friendlyName: 'Fetch changes and subcribe to project (pack or app)',


  description: 'Sync with the server to get a changelog for this project and subscribe to socket events for future changes.',


  cacheable: true,


  inputs: {

    id: {
      description: 'The unique id of the project.',
      example: 'mikermcneil/export-test',
      required: true
    },

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project ("app" or "machinepack")',
      example: 'machinepack',
      required: true,
    },

    secret: {
      description: 'The Treeline secret key of an account w/ access to this project.',
      example: '29f559ae-3bec-4d0a-8458-1f4e32a72407',
      protect: true,
      required: true
    },

    socket: {
      friendlyName: 'Socket',
      description: 'The client socket to use to make the virtual request.',
      extendedDescription: 'This client socket must already be connected to the Treeline API. It must be capable of making virtual requests (e.g. spawned by sails.io.js).',
      example: '===',
      readOnly: true
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      extendedDescription: 'Note that this is only used for HTTP fallback.',
      // TODO: implement HTTP fallback
      example: 'https://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    },

    machineHashes: {
      description: 'An array of mappings between machine identities and the hash calculated from the corresponding machine definition.',
      extendedDescription: 'If provided, these hashes will be sent to the server, and the relevant machine definitions will only be initially fetched if their hashes are different from what is already stored on Treeline.io.',
      example: [{
        machine: 'some-machine-identity',
        hash: '1390ba9z9140$1-3a914n4'
      }]
    },

    npmDependencies: {
      description: 'An array of NPM dependencies for this project pack',
      example: [{
        name: 'lodash',
        semverRange: '^3.9.0'
      }]
    },

    packHash: {
      description: 'A hash string calculated from the pack metadata.',
      example: 'a8319azj39$29130nfan3',
      extendedDescription: 'If provided, this hash will be sent to the server, and the pack metadata will only be initially fetched if the hash is different from what is already stored on Treeline.io.',
    },

  },


  exits: {

    forbidden: {
      description: 'The Treeline server indicated that the provided keychain is not permitted to access this remote.'
    },

    notFound: {
      description: 'The Treeline server indicated that the project with the specified id no longer exists.'
    },

    success: {
      friendlyName: 'then',
      variableName: 'packChangelog',
      example: [{
        slug: 'irlnathan/machinepack-foobar',
        identity: 'machinepack-foobar',
        verb: 'set',
        hash: 'fdasfadsfads',
        machines: [{}],
        npmDependencies: [{}],
        routes: [{}],
        models: [{}],
        configVars: [{}]
      }],
    },

  },


  fn: function(inputs, exits) {
    var util = require('util');
    var MPRttc = require('machinepack-rttc');
    var path = require('path');

    inputs.id = inputs.id.replace(/^_project_/, '');

    var url = '/api/v1/machinepacks/'+(inputs.type === 'machinepack' ? inputs.id : '_project_' + inputs.id)+'/sync';

    // TODO: pull into mp-sockets (also implement http fallback)
    inputs.socket.request({
      method: 'get',
      url: url,
      headers: { 'x-auth': inputs.secret },
      params: {
        // Send along hashes of each machine, as well as one
        // additional hash for the pack's package.json metadata.
        packHash: inputs.packHash,
        machineHashes: inputs.machineHashes,
        npmDependencies: inputs.npmDependencies
      }
    }, function serverResponded (body, jwr) {
      // console.log('Sails responded with: ', body); console.log('with headers: ', jwr.headers); console.log('and with status code: ', jwr.statusCode);
      // console.log('jwr.error???',jwr.error);
      if (jwr.error) {

        // Set up an exit via 'forbidden'.
        if (jwr.statusCode === 401) {
          jwr.exit = 'forbidden';
        }

        // Set up an exit via 'notFound'.
        if (jwr.statusCode === 404) {
          jwr.exit = 'notFound';
        }

        // If initial pack subscription fails, kill the scribe server
        // and stop listening to changes
        return exits(jwr);
      }

      // Parse packs changelog
      MPRttc.coerce({
        value: body,
        typeSchema: MPRttc.infer({
          example: [{
            slug: 'irlnathan/machinepack-foobar',
            identity: 'machinepack-foobar',
            verb: 'set',
            hash: 'sdifhasdjfbdasjf',
            machines: [{}],
            npmDependencies: [{}],
            routes: [{}],
            models: [{}],
            configVars: [{}]
          }]
        }).execSync()
      }).exec({
        error: exits.error,
        success: function (data){
          return exits.success(data);
        }
      });// </MpJson.parse>

    }); //</socket.request>

  }

};

