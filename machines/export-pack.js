module.exports = {


  friendlyName: 'Export pack',


  description: 'Export a machinepack from Treeline into a folder of code on this computer.',


  inputs: {

    username: {
      description: 'The username of the account that owns the machinepack to export',
      extendedDescription: 'If omitted, the command-line user\'s account will be used.',
      example: 'mikermcneil'
    },

    id: {
      description: 'The id of the machinepack to export',
      extendedDescription: 'If omitted, the command-line user will be prompted to pick from the available options.',
      example: 'mikermcneil/export-test'
    },

    destination: {
      description: 'Absolute path where the machinepack will be exported.',
      extendedDescription: 'Defaults to the machinepack\'s name (lowercased) resolved from the current working directory.  For example, if you\'ve cd\'d into your Desktop and you\'re exporting a machinepack with name "Foo", then this might default to "/Users/mikermcneil/Desktop/foo.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    force: {
      description: 'Whether to force/overwrite files that already exist at the destination',
      example: true,
      defaultsTo: false
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

    notLoggedIn: {
      description: 'This computer is not currently logged in to Treeline.'
    },

    alreadyExists: {
      description: 'A file or folder with the same name as this machinepack already exists at the destination path. Enable the `force` input and try again to overwrite.',
      example: '/Users/mikermcneil/code/foo'
    },

    success: {
      description: 'Done.'
    },

  },


  fn: function (inputs, exits){
    return exits.error('Currently unimplemented');
  }


};
