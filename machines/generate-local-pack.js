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
    var async = require('async');
    var _ = require('lodash');
    var Filesystem = require('machinepack-fs');
    var Machines = require('machinepack-machines');


    // `packData` contains basic metadata about the machinepack as well
    // as complete metadata about each machine-- including the `fn` (implementation code)
    var packData = inputs.packData;

    // Determine the dictionary that will become the package.json file.
    var pkgMetadata = {
      private: true,
      name: packData._id,
      version: packData.version || '0.1.0',
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

        // Write the generic `index.js` file
        var indexJsPath = path.resolve(inputs.destination,'index.js');
        var indexJsCode = '// This is a boilerplate file which should not need to be changed.\nmodule.exports = require(\'machine\').pack({\n  pkg: require(\'./package.json\'),\n  dir: __dirname\n});\n';
        Filesystem.write({
          destination: indexJsPath,
          string: indexJsCode
        }).exec({
          error: function (err) {
            return exits.error(err);
          },
          alreadyExists: function (){
            return exits.alreadyExists(indexJsPath);
          },
          success: function (){

            // Loop over each machine in the pack
            async.each(packData.machines, function (thisMachine, next){

              // Determine the path where the new module will be written
              var machineModulePath = path.resolve(inputs.destination, 'machines', thisMachine.identity+'.js');
              // and the code that it will consist of:
              // (build a JavaScript code string which represents the provided machine metadata)
              var machineModuleCode;
              try {
                machineModuleCode = Machines.buildMachineCode({
                  friendlyName: thisMachine.friendlyName || thisMachine.identity,
                  description: thisMachine.description,
                  extendedDescription: thisMachine.extendedDescription,
                  inputs: thisMachine.inputs,
                  exits: thisMachine.exits,
                  fn: thisMachine.fn
                }).execSync();
              }
              catch (e) {
                return next(e);
              }

              // Write the machine file
              Filesystem.write({
                destination: machineModulePath,
                string: machineModuleCode
              }).exec({
                error: function (err) {
                  return next(err);
                },
                alreadyExists: function (){
                  var err = new Error('Something already exists at '+machineModulePath);
                  err.code = err.exit = 'alreadyExists';
                  err.output = machineModulePath;
                  return next(err);
                },
                success: function (){
                  next();
                }
              });//</Filesystem.write>
            }, function afterwards(err) {
              if (err) {
                if (_.isObject(err) && err.code === 'alreadyExists') {
                  return exits.alreadyExists(err.output);
                }
                return exits.error(err);
              }
              return exits.success();
            });//</async.each>
          }
        });//</Filesystem.writeJson>
      }
    });//</Filesystem.writeJson>
  },



};


