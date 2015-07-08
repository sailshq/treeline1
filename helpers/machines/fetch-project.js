module.exports = {


  friendlyName: 'Fetch project (pack or app)',


  description: 'Get information about a project (e.g. name, description)',


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

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'https://api.treeline.io',
      defaultsTo: 'https://api.treeline.io'
    }

  },


  exits: {

    success: {
      friendlyName: 'then',
      example: {
        owner: 'mikermcneil',
        type: 'machinepack',
        displayName: 'Export test',
        identity: 'export-test',
        id: 'mikermcneil/export-test',
      },
    },

  },


  fn: function(inputs, exits) {
    var util = require('util');
    var IfThen = require('machinepack-ifthen');
    var Http = require('machinepack-http');
    var MPJson = require('machinepack-json');

    Http.sendHttpRequest({
      method: 'get',
      baseUrl: inputs.treelineApiUrl,
      url: '/api/v2/machine-packs/' + (inputs.type === 'machinepack' ? inputs.id : '_project_' + inputs.id),
      headers: {
       'x-auth': inputs.secret
      },
    }).exec({
      error: exits.error,
      success: function (response) {
        MPJson.parse({
          json: response.body,
          schema: {
            id: '12a3bf2e-2932b31',
            friendlyName: 'Cool Pack',
            description: 'Do cool things',
            iconUrl: 'http://icon.com',
            access: 'public',
            updatedAt: '2015-03-23T22:52:49.000Z',
            owner: { username: 'rachaelshaw' }
          }
        }).exec({
          error: exits.error,
          success: function (jsonData){
            if (!jsonData.id) {
              return exits.error(new Error('Unexpected response from Treeline:'+util.inspect(jsonData,{depth: null})));
            }
            return exits.success({
              type: 'machinepack',
              id: jsonData.id,
              identity: jsonData.id,
              displayName: jsonData.friendlyName,
              owner: jsonData.owner.username
            });
          }
        });// </MpJson.parse>
      }
    });// </Http.sendHttpRequest>

  }

};
