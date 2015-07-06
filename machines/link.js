module.exports = {


  friendlyName: 'Link',


  description: 'Link the current directory to an app or machinepack in Treeline.',


  inputs: {

    dir: {
      description: 'Path to the local project.',
      extendedDescription: 'If unspecified, defaults to the current working directory.  If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    type: {
      friendlyName: 'Type',
      description: 'The type of Treeline project to link (app or machinepack)',
      example: 'machinepack',
      defaultsTo: 'app'
    },

    treelineApiUrl: {
      description: 'The base URL for the Treeline API (useful if you\'re in a country that can\'t use SSL, etc.)',
      example: 'http://api.treeline.io'
    },

    keychainPath: {
      description: 'Path to the keychain file on this computer. Defaults to `.treeline.secret.json` in the home directory.',
      extendedDescription: 'If provided as a relative path, this will be resolved from the current working directory.',
      example: '/Users/mikermcneil/Desktop/foo'
    },

    // CURRENTLY FOR PACKS ONLY (todo: refactor)
    // ======================================
    id: {
      description: 'The id of the machinepack to link',
      example: 'mikermcneil/export-test',
      extendedDescription: 'If omitted, the command-line user will be prompted to make a choice.'
    },

    username: {
      description: 'The username of the account which owns the desired machinepack.',
      example: 'rachaelshaw',
      extendedDescription: 'If omitted, the command-line user will be the assumed owner.'
    },

    // FOR APPS ONLY (todo: refactor)
    // ======================================
    identity: {
      description: 'The identity (i.e. slug) of the app to link',
      example: 'my-cool-app'
    }

  },

  exits: {

    noApps: {
      description: 'No apps belong to the account associated with this computer.',
      example: {
        username: 'mikermcneil'
      }
    },

    noMachinepacks: {
      description: 'That user account doesn\'t have any accessible machinepacks.',
      example: {
        username: 'mikermcneil'
      }
    },

    unknownType: {
      description: 'Unknown project type.  You can link an "app" or a "machinepack".'
    },

    forbidden: {
      description: 'Username/password combo invalid or not applicable for the selected app.'
    },

    success: {
      example: {
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app',
        owner: 'mikermcneil',
        id: 123
      }
    }

  },


  fn: function (inputs, exits) {
    var IfThen = require('machinepack-ifthen');
    var thisPack = require('../');

    // If `inputs.type` was provided, use it.
    // Otherwise, sniff around for the package.json file and figure out
    // what kind of project this is.
    thisPack.normalizeType({
      type: inputs.type
    }).exec({
      error: exits.error,
      success: function (type) {

        thisPack.loginIfNecessary({
          keychainPath: inputs.keychainPath,
          treelineApiUrl: inputs.treelineApiUrl,
        })
        .exec({
          error: exits.error,
          success: function (keychain){

            IfThen.ifThenFinally({

              bool: inputs.id,

              // Example schema
              expectedOutput: {
                owner: 'mikermcneil',
                type: 'machinepack',
                displayName: 'Export test',
                identity: 'export-test',
                id: 'mikermcneil/export-test',
              },

              // If id was supplied, we don't need to list options/show
              // a prompt, but we do also still need to fetch more
              // information about the project.
              then: function idWasExplicitlyProvidedAsInput (_inputs, exits) {
                // linkedProjectData
                // TODO
              },

              // If no `id` was provided, fetch a list of available options and
              // prompt the command-line user.  Then potentially fetch more
              // information about the chosen project.
              orElse: function noIdProvided (_inputs, exits){
                // List apps or machinepacks
                // TODO

                // Prompt command-line user to choose one
                // TODO
              }

            }).exec({
              error: exits.error,
              success: function(linkedProjectData) {

                // Write linkfile
                thisPack.writeLinkfile({
                  owner: linkedProjectData.owner,
                  type: linkedProjectData.type,
                  displayName: linkedProjectData.displayName, // TODO: look this up when identity is provided manually w/o listing apps
                  identity: linkedProjectData.identity,
                  id: linkedProjectData.id,
                  dir: inputs.dir,
                }).exec({
                  error: exits.error,
                  success: function (){
                    return exits.success(linkedProjectData);
                  }
                }); //</writeLinkfile>
              }
            }); // </IfThen.ifThenFinally>
          }
        }); // </loginIfNecessary>
      }
    }); //</normalizeType>

  }

};
