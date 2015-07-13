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
      example: 'machinepack'
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

    id: {
      description: 'The id of the app or machinepack to link',
      example: 'mikermcneil/export-test',
      extendedDescription: 'If omitted, the command-line user will be prompted to make a choice.'
    },

    owner: {
      description: 'The owner of the desired project (i.e. their username)',
      example: 'rachaelshaw',
      extendedDescription: 'If omitted, the command-line user will be the assumed owner.'
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

    unrecognizedCredentials: {
      description: 'Unrecognized username/password combination.'
    },

    forbidden: {
      description: 'The Treeline server indicated that the provided keychain is not permitted to list apps/packs.'
    },

    success: {
      example: {
        id: 'mikermcneil/my-cool-app',
        identity: 'my-cool-app',
        displayName: 'My Cool App',
        type: 'app',
        owner: 'mikermcneil'
      }
    }

  },


  fn: function (inputs, exits) {
    var _ = require('lodash');
    var IfThen = require('machinepack-ifthen');
    var Prompts = require('machinepack-prompts');
    var LocalTreelineProjects = require('machinepack-local-treeline-projects');
    var thisPack = require('../');

    // If `inputs.type` was provided, use it.
    // Otherwise, sniff around for the package.json file and figure out
    // what kind of project this is.
    LocalTreelineProjects.normalizeType({
      type: inputs.type
    }).exec({
      error: exits.error,
      success: function (type) {

        // Ensure this computer is logged in, and if not, log in interactively.
        thisPack.loginIfNecessary({
          keychainPath: inputs.keychainPath,
          treelineApiUrl: inputs.treelineApiUrl,
        })
        .exec({
          error: exits.error,
          unrecognizedCredentials: exits.unrecognizedCredentials,
          success: function (keychain){

            // Get id of the app or machinepack to link
            IfThen.ifThenFinally({

              bool: inputs.id,

              expectedOutput: 'mikermcneil/export-test',

              // If id was supplied, we don't need to list options/show
              // a prompt.
              then: function idWasExplicitlyProvidedAsInput (__, exits) {
                return exits.success(inputs.id);
              },

              // If no `id` was provided, fetch a list of available options and
              // prompt the command-line user.  Then potentially fetch more
              // information about the chosen project.
              orElse: function noIdProvided (__, exits){

                // List apps or machinepacks
                IfThen.ifThenFinally({

                  bool: type === 'app',

                  expectedOutput: [{
                    name: 'display name for use in prompt',
                    value: 'unique-id-of-project'
                  }],

                  then: function fetchApps(__, exits){
                    thisPack.listApps({
                      secret: keychain.secret,
                      owner: inputs.owner||keychain.username,
                      treelineApiUrl: inputs.treelineApiUrl
                    }).exec({
                      error: exits.error,
                      forbidden: exits.forbidden,
                      success: function (apps) {
                        return exits.success(_.reduce(apps, function(memo, app) {
                          memo.push({
                            name: app.displayName,
                            value: app.id
                          });
                          return memo;
                        }, []));
                      }
                    });
                  },

                  orElse: function fetchPacks(__, exits){
                    thisPack.listPacks({
                      secret: keychain.secret,
                      owner: inputs.owner||keychain.username,
                      treelineApiUrl: inputs.treelineApiUrl
                    }).exec({
                      error: exits.error,
                      forbidden: exits.forbidden,
                      success: function (machinepacks){
                        return exits.success(_.reduce(machinepacks, function(memo, machinepack) {
                          memo.push({
                            name: machinepack.displayName,
                            value: machinepack.id
                          });
                          return memo;
                        }, []));
                      }
                    });
                  }

                }).exec({
                  error: exits.error,
                  success: function interactivelyPromptForProjectToLink(choices){

                    // If there are no choices, we can't possibly link anything.
                    if (choices.length === 0) {
                      if (type === 'app') { return exits({exit:'noApps'}); }
                      else { return exits({exit:'noMachinepacks'}); }
                    }

                    var promptMsg;
                    if (type === 'app') {
                      promptMsg = 'Which app would you like to link with the current directory?';
                    }
                    else {
                      promptMsg = 'Which machinepack would you like to link with the current directory?';
                    }

                    // Prompt the command-line user to make a choice from a list of options.
                    Prompts.select({
                      choices: choices,
                      message: promptMsg
                    }).exec(exits);
                  }
                });
              }

            }).exec({
              error: function (err){
                return exits(err);
              },
              success: function(projectId) {

                // Look up more information about the project to link.
                thisPack.getProjectInfo({
                  id: projectId,
                  type: type,
                  secret: keychain.secret,
                  treelineApiUrl: inputs.treelineApiUrl,
                }).exec({
                  error: function (err) {
                    return exits(err);
                  },
                  success: function (project){

                    // Write linkfile
                    LocalTreelineProjects.writeLinkfile({
                      owner: project.owner,
                      type: type,
                      displayName: project.displayName,
                      identity: project.identity,
                      id: project.id,
                      dir: inputs.dir,
                    }).exec({
                      error: function (err) {
                        return exits(err);
                      },
                      success: function (){
                        return exits.success(project);
                      }
                    }); //</writeLinkfile>
                  }
                }); //</getProjectInfo>
              }
            }); // </IfThen.ifThenFinally>
          }
        }); // </loginIfNecessary>
      }
    }); //</normalizeType>

  }

};
