module.exports = {


  friendlyName: 'Get machinepack',


  description: 'Get information about a machinepack (e.g. name, description)',


  cacheable: true,


  inputs: {

    packId: {
      friendlyName: 'packId',
      example: 'mikermcneil/export-test',
      description: '',
      required: true
    },

    authToken: {
      friendlyName: 'authToken',
      example: 'adh919ad9139348adfj19',
      description: ''
    },

  },


  exits: {

    error3: {
      friendlyName: 'error3',
      void: true,
    },

    notFound: {
      friendlyName: 'notFound',
      example: {
        status: 404,
        headers: '{"Accepts":"application/json"}',
        body: '[{"maybe some JSON": "like this"}]  (but could be any string)'
      },
    },

    badRequest: {
      friendlyName: 'badRequest',
      example: {
        status: 400,
        headers: '{"Accepts":"application/json"}',
        body: '[{"maybe some JSON": "like this"}]  (but could be any string)'
      },
    },

    forbidden: {
      friendlyName: 'forbidden',
      example: {
        status: 403,
        headers: '{"Accepts":"application/json"}',
        body: '[{"maybe some JSON": "like this"}]  (but could be any string)'
      },
    },

    unauthorized: {
      friendlyName: 'unauthorized',
      example: {
        status: 401,
        headers: '{"Accepts":"application/json"}',
        body: '[{"maybe some JSON": "like this"}]  (but could be any string)'
      },
    },

    serverError: {
      friendlyName: 'serverError',
      example: {
        status: 503,
        headers: '{"Accepts":"application/json"}',
        body: '[{"maybe some JSON": "like this"}]  (but could be any string)'
      },
    },

    requestFailed: {
      friendlyName: 'requestFailed',
      void: true,
    },

    error: {
      friendlyName: 'error',
      void: true,
    },

    error4: {
      friendlyName: 'error4',
      void: true,
    },

    couldNotParse: {
      friendlyName: 'couldNotParse',
      void: true,
    },

    success: {
      friendlyName: 'then',
      example: {
        id: 'mikermcneil/export-test',
        friendlyName: 'Cool Pack',
        description: 'Do cool things',
        imageUrl: 'http://icon.com',
        access: 'public',
        updatedAt: '2015-03-23T22:52:49.000Z',
        owner: 'rachaelshaw'
      },
    },

  },


  fn: function(inputs, exits) {
    // Send HTTP request
    require('machinepack-http').sendHttpRequest({
      "url": "/machine-packs/" + inputs.packId,
      "baseUrl": "https://api.treeline.io/api/v2",
      "method": "GET",
      "params": {},
      "headers": {
        "x-auth": inputs.authToken
      }
    }).exec({
      "error": function(sendHTTPRequest) {
        exits.error3(sendHTTPRequest);
      },
      "notFound": function(sendHTTPRequest) {
        exits.notFound(sendHTTPRequest);
      },
      "badRequest": function(sendHTTPRequest) {
        exits.badRequest(sendHTTPRequest);
      },
      "forbidden": function(sendHTTPRequest) {
        exits.forbidden(sendHTTPRequest);
      },
      "unauthorized": function(sendHTTPRequest) {
        exits.unauthorized(sendHTTPRequest);
      },
      "serverError": function(sendHTTPRequest) {
        exits.serverError(sendHTTPRequest);
      },
      "requestFailed": function(sendHTTPRequest) {
        exits.requestFailed(sendHTTPRequest);
      },
      "success": function(sendHTTPRequest) {
        // Parse JSON
        require('machinepack-util').parseJson({
          "json": (sendHTTPRequest && sendHTTPRequest.body),
          "schema": {
            id: "12h3jkh2jk31m",
            friendlyName: "Cool Pack",
            description: "Do cool things",
            iconUrl: "http://icon.com",
            access: "public",
            updatedAt: "2015-03-23T22:52:49.000Z",
            owner: {
              username: 'rachaelshaw'
            }
          }
        }).exec({
          "error": function(parseJSON) {
            exits.error4(parseJSON);
          },
          "couldNotParse": function(parseJSON) {
            exits.couldNotParse(parseJSON);
          },
          "success": function(parseJSON) {
            // Build dictionary
            require('machinepack-util').createDictionary({
              "dictionary": {
                id: (parseJSON && parseJSON.id),
                friendlyName: (parseJSON && parseJSON.friendlyName),
                description: (parseJSON && parseJSON.description),
                imageUrl: (parseJSON && parseJSON.iconUrl),
                access: (parseJSON && parseJSON.access),
                updatedAt: (parseJSON && parseJSON.updatedAt),
                owner: (parseJSON && parseJSON.owner && parseJSON.owner.username)
              }
            }).exec({
              "error": function(buildDictionary) {
                exits.error(buildDictionary);
              },
              "success": function(buildDictionary) {
                exits.success(buildDictionary);
              }
            });

          }
        });

      }
    });
  }

};
