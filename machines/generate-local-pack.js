module.exports = {


  friendlyName: 'Generate local pack',


  description: 'Generate a folder and files from the provided machinepack data.',


  extendedDescription: '',


  inputs: {

    destination: {
      description: 'Absolute path where the machinepack will be exported.',
      extendedDescription: 'Defaults to the machinepack\'s name (lowercased) resolved from the current working directory.  For example, if you\'ve cd\'d into your Desktop and you\'re exporting a machinepack with name "Foo", then this might default to "/Users/mikermcneil/Desktop/foo.',
      example: '/Users/mikermcneil/Desktop/foo',
      required: true
    },

    packData: {
      description: 'The machinepack and machine metadata/code to generate from.',
      typeclass: 'dictionary',
      required: true
    }

  },


  defaultExit: 'success',


  exits: {

    error: {
      description: 'Unexpected error occurred.',
    },

    alreadyExists: {
      description: 'A file or folder with the same name as this machinepack already exists at the destination path.',
      example: '/Users/mikermcneil/code/foo'
    },

    success: {
      description: 'Done.',
    },

  },


  fn: function (inputs,exits) {

    var path = require('path');
    var _ = require('lodash');
    var Filesystem = require('machinepack-fs');


    // `packData` contains basic metadata about the machinepack as well
    // as complete metadata about each machine-- including the `fn` (implementation code)
    var packData = inputs.packData;

    // Determine the dictionary that will become the package.json file.
    var pkgMetadata = {
      private: true,
      name: packData._id, //packData.friendlyName.toLowerCase().replace(/[^a-z]/),
      version: '0.1.0',
      description: packData.description || '',
      keywords: [
        packData.friendlyName,
        'machines',
        'machinepack'
      ],
      author: packData.author,
      license: packData.license,
      dependencies: _.reduce(packData.dependencies, function (memo, dependency) {
        memo[dependency.name] = dependency.semverRange;
        return memo;
      }, {
        machine: '^4.0.0'
      }),
      // devDependencies: {
      //   test-machinepack-mocha: ^0.2.2
      // },
      machinepack: {
        _id: packData._id,
        friendlyName: packData.friendlyName,
        machineDir: 'machines/',
        machines: _.pluck(packData.machines, 'identity')
      }
    };

    // Write the package.json file (and the empty folder)
    var packageJsonPath = path.resolve(inputs.destination,'package.json');
    Filesystem.writeJson({
      destination: packageJsonPath,
      json: pkgMetadata
    }).exec({
      error: function (err){
        return exits.error(err);
      },
      alreadyExists: function (){
        return exits.alreadyExists(packageJsonPath);
      },
      success: function (){
        // Loop over each machine in the pack
        // ...

          // Determine the module code that will be written out
          // TODO

          // Write the machine file
          // TODO

        return exits.success();
      }
    });//</Filesystem.writeJson>
  },



};


