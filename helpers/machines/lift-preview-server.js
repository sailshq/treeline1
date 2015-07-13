module.exports = {


  friendlyName: 'Lift preview server',


  description: 'Lift the preview server on a local port (either the scribe utility or the in-development backend app.)',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project this is ("app" or "machinepack")',
      extendedDescription: 'If left unspecified, we\'ll sniff around in the directory and guess what kind of thing this is based on its package.json file.',
      example: 'machinepack'
    },

    dir: {
      description: 'Path to the local project.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    localPort: {
      description: 'The local port to run the preview server on.  Defaults to 1337.',
      example: 1337,
      defaultsTo: 1337
    },

  },


  exits: {

  },


  fn: function (inputs,exits) {

    var path = require('path');
    var _ = require('lodash');

    // The path to the project is generally the current working directory
    // Here, we ensure is is absolute, and if it was not specified, default
    // it to process.cwd(). If it is relative, we resolve it from the current
    // working directory.
    inputs.dir = inputs.dir ? path.resolve(inputs.dir) : process.cwd();

    // This might be an app...
    if (inputs.type === 'app') {

      var Sails = require('sails').Sails;

      var sailsConfig = _.merge({
        log: { level: 'error' },
        port: inputs.localPort
      }, {});
      sailsConfig = _.merge(sailsConfig,{
        globals: false,
        hooks: {
          grunt: false
        }
      });

      var app = Sails();
      app.lift(sailsConfig, function (err) {
        if (err) {
          return exits.error(err);
        }
        return exits.success(app);
      });
      return;
    }


    // ...or a pack.
    var Scribe = require('test-scribe');
    Scribe(_.extend({
      pathToPack: inputs.dir,
      port: inputs.localPort
    }, {}), function (err, localScribeApp) {
      if (err) {
        return exits.error(err);
      }
      return exits.success(localScribeApp);
    });


  },



};
