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

    // TODO

    var EXAMPLE = [
      {
        identity: 'machinepack-baz',
        props: {
          friendlyName: 'Baz'
        },
        machinesChangelog: [
          {
            identity: 'foo',
            verb: 'del'
          },
          {
            identity: 'bar',
            verb: 'set',
            def: {
              inputs: [{}],
              fn: 'function(inputs, exits) {}',
              // ...
            }
          }
        ]
      }
    ];

    return exits.success();

  },


};
