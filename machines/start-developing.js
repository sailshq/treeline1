module.exports = {


  friendlyName: 'Start interactive development session',


  description: 'Start a local/development preview session with an app or machinepack.',


  inputs: {

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project this is ("app" or "machinepack")',
      extendedDescription: 'If left unspecified, we\'ll sniff around in the directory and guess what kind of thing this is based on its package.json file.',
      example: 'machinepack'
    },

    dontOpenBrowser: {
      description: 'Prevent the browser from being opened automatically and navigating to the scribe utility when a pack is previewed?',
      example: true,
      defaultsTo: false
    },

    onHasKeychain: {
      description: 'An optional notifier function that will be called when a keychain is located (doesn\'t mean it is necessarily valid).',
      example: '->',
    },

    onLoadProjectInfo: {
      description: 'An optional notifier function that will be called when basic info about the pack or app has been retrieved.',
      example: '->',
    },

    onConnected: {
      description: 'An optional notifier function that will be called when a connection is established with Treeline.io and this pack is being initially synchronized with the server.',
      example: '->'
    },

    onSyncError: {
      description: 'An optional notifier function that will be called when Treeline attempts to sync remote changes to the local pack, but it fails.',
      example: '->'
    },

    onSyncSuccess: {
      description: 'An optional notifier function that will be called when Treeline attempts to sync remote changes to the local pack and it works.',
      example: '->'
    },

    onInitialSyncSuccess: {
      description: 'An optional notifier function that will be called the first time Treeline successfully synchronizes the local project w/ treeline.io.',
      example: '->',
    },

    onPreviewServerLifted: {
      description: 'An optional notifier function that will be called when the preview server has successfully lifted and can be safely accessed.',
      example: '->',
    },

    onSocketDisconnect: {
      description: 'An optional notifier function that will be called if/when the remote connection with http://treeline.io is lost (and as the local Treeline client attempts to reconnect).',
      example: '->'
    },

    onFlushError: {
      description: 'An optional notifier function that will be called if/when the router of the locally-running app cannot be flushed.',
      example: '->'
    },

    localPort: {
      description: 'The local port to run the preview server on (either a sails app or the `scribe` utility, depending on what is being previewed).  Defaults to 1337.',
      example: 1337,
      defaultsTo: 1337
    },

    dir: {
      description: 'Path to the local project.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    keychainPath: {
      description: 'Path to the keychain file on this computer. Defaults to `.treeline.secret.json` in the home directory.',
      extendedDescription: 'If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
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

    unknownType: {
      description: 'Unknown project type.  You can link an "app" or a "machinepack".'
    },

    notLinked: {
      description: 'The current working directory is not linked to an app or machinepack on Treeline.io.'
    },

    noApps: {
      description: 'No apps belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
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
      variableName: 'result',
      description: 'Done.',
      example: '==='
    },

  },


  fn: function (inputs,exits) {
    var helperPack = require('../helpers');

    // If `inputs.type` was provided, use it.
    // Otherwise, sniff around for the package.json file and figure out
    // what kind of project this is.
    helperPack.normalizeType({
      type: inputs.type
    }).exec({
      error: exits.error,
      success: function (type) {

        // Start interactive development session for either an app or a machinepack
        return helperPack.startDevelopingProject(inputs).exec(exits);

        // if (type === 'app') {
        //   return helperPack.startDevelopingProject(inputs).exec(exits);
        // }
        // else {
        //   return helperPack.startDevelopingPack(inputs).exec(exits);
        // }
      }
    });

  },


};
