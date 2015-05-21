var wrench = require('wrench');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var beautify = require('js-beautify').js_beautify;
var fs = require('fs-extra');
var exec = require('child_process').exec;
var debug = require('debug')('treeline');
var NPM = require('machinepack-npm');
module.exports = function(sails, socket) {

  return {

    /**
     * Get the full list of machinepacks used by this project
     *
     * Expected server response:
     * {
     *  "sails-core-auth__1.1": {
     *    "machines": {
     *      "auth__check_login:0.1.2.3": "function(inputs, exits){...}",
     *      "auth__logout:0.1.0.1": "function(inputs, exits){...}"
     *    },
     *    "dependencies": {
     *      "request": "0.2.8",
     *      "bcrypt": "1.2.3"
     *    }
     *  },
     *  "sails-core-response__2.2": {
     *    ...
     *  }
     * }
     *
     *
     * @param  {[type]}   config  [description]
     * @param  {[type]}   options [description]
     * @param  {Function} cb      [description]
     * @return {[type]}           [description]
     */
    reloadAllMachinePacks: function(config, options, cb) {

      // console.log('cli- reloadAllMachinePacks');
      // console.log('\n\n','config',':\n====================\n',config);
      // console.log('\n\n','options',':\n====================\n',options);

      debug('cli - reloadAllMachinePacks()');
      var self = this;
      cb = cb || function(){};
      options = options || {};
      config = config || sails.config.treelineCli;
      options.config = config;

      socket.get(config.src.url + '/machinepacks?secret='+config.src.secret, function(data, jwr) {
        if (jwr.error) {
          // console.log('\n\n','got error fetching machinepacks',':\n====================\n',jwr);
          return cb(jwr.body);
        }
        // console.log('\n\n','got machinepacks',':\n====================\n',data);
        self.cleanPacks(options, data, function(err) {
          if (err) {return cb(err);}
          self.writePacks(options, data, cb);
        });

      });

    },









    /**
     * Delete existing machinepacks on local disk which are no longer in use.
     *
     * @param  {[type]}   options [description]
     * @param  {[type]}   data    [description]
     * @param  {Function} cb      [description]
     * @return {[type]}           [description]
     */
    cleanPacks: function(options, data, cb) {
      // console.log('cli- cleanPacks');
      debug('cli - cleanPacks()');
      if (typeof data == 'function') {
        cb = data;
        data = {};
      } else if (typeof options == 'function') {
        cb = options;
        data = {};
        options = {};
      }

      if(_.isObject(data) && !_.keys(data).length) {
        return cb();
      }

      var curDirs = _.keys(data);
      var machinesDir = path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), 'api/machines');
      // Make the dir if it doesn't exist
      try {
        fs.mkdirsSync(machinesDir);
      } catch(e) {}
      // Get all of the machine pack subdirs
      var curMachinePacks = fs.readdirSync(machinesDir);
      // Find the ones that aren't present in the curDirs array
      var eraseDirs = _.difference(curMachinePacks, curDirs);
      // Wrench 'em
      eraseDirs.forEach(function(dir) {
        wrench.rmdirSyncRecursive(path.join(machinesDir,dir), true);
      });
      return cb();

    },











    /**
     * Write new pack folders on local disk in `api/machines/`
     *
     * @param  {[type]}   options [description]
     * @param  {[type]}   data    [description]
     * @param  {Function} cb      [description]
     * @return {[type]}           [description]
     */
    writePacks: function(options, data, cb) {
      // console.log('cli- writePacks ','\n\noptions\n==============\n',options,'\n\ndata\n==============\n', data);
      debug('cli - writePacks()');
      var machinesDir = path.join(process.cwd(), (options.export ? '' :  'node_modules/treeline/'), 'api/machines');
      // Loop through all the machinepack directories
      async.each(_.keys(data), function(machineDir, nextPack) {
        // Create the dir if necessary
        try {
          fs.mkdirSync(path.join(machinesDir, machineDir));
        } catch (e) {}
        // Get the package.json file
        var packageJson;

        // The package.json string to write
        var packageJsonStr;

        // If the data has an npmPackageName, we want to create a package.json file, index.js file and run
        // npm install
        if(data[machineDir].npmPackageName) {

          // check if the dependency exists already
          var fileExists = fs.existsSync(path.join(machinesDir, machineDir, 'node_modules', data[machineDir].npmPackageName));

          // If the dependency exists, then we can continue on
          if(fileExists) {
            return nextPack();
          }

          // Build a package.json file
          var buildPackageJson = function() {
            packageJson = {
              dependencies: {},
              machinepack: {
                machines: []
              }
            };
            packageJson.dependencies[data[machineDir].npmPackageName] = data[machineDir].publishedReleaseVersion;
          };

          try {
            packageJson = fs.readFileSync(path.join(machinesDir, machineDir, "package.json"));
            packageJson = JSON.parse(packageJson);

            if(!packageJson.dependencies[data[machineDir].npmPackageName]) {
              buildPackageJson();
            }

          } catch (e) {
            // If it doesn't exist (probably because we just created the directory),
            // try and create it
            if (e.code == 'ENOENT') {
              buildPackageJson();
            } else {
              throw e;
            }
          }

          // Output the package.json for this pack
          packageJsonStr = beautify(JSON.stringify(packageJson), {indent_size: 2});

          // Run npm install in the folder
          NPM.installPackage({
            name: data[machineDir].npmPackageName,
            version: data[machineDir].publishedReleaseVersion,
            prefix: path.join(machinesDir, machineDir)
          }).exec({
            error: function(err) {
              return nextPack(err);
            },
            invalidSemVer: function() {
              var msg = 'Invalid semver for package ' +  data[machineDir].npmPackageName;
              return nextPack(new Error(msg));
            },
            success: function() {

               // Write the package.json file to disk
              fs.writeFileSync(path.join(machinesDir, machineDir, 'package.json'), packageJsonStr);

              // Write out the index file
              var contents = "module.exports = require('" + data[machineDir].npmPackageName + "');";
              fs.writeFileSync(path.join(machinesDir, machineDir, 'index.js'), contents);

              return nextPack();
            }
          });
        }

        else {
          try {
            packageJson = fs.readFileSync(path.join(machinesDir, machineDir, "package.json"));
            packageJson = JSON.parse(packageJson);
          } catch (e) {
            // If it doesn't exist (probably because we just created the directory),
            // try and create it
            if (e.code == 'ENOENT') {
              packageJson = {machinepack:{machines: [], machineVersions: {}}};
            } else {
              throw e;
            }
          }
          // Now compare the list of machines we got from the server to the list we have
          var machines = data[machineDir].machines;
          var newMasters = _.map(_.keys(machines), function(master) {
            return master.split(':')[0];
          });
          var currentMasters = _.keys(packageJson.machinepack.machineVersions);
          var mastersToDelete = _.difference(currentMasters, newMasters);
          // Delete any masters that are no longer part of the pack
          mastersToDelete.forEach(function(master) {
            try {
              fs.unlinkSync(path.join(machinesDir, master + '.js'));
            } catch(e) {
              // Do nothing for now
            }
          });
          var newPackageJson = {dependencies: data[machineDir].dependencies, machinepack:{machines:[], machineVersions: {}}};
          // Loop through all of the masters the server reported as making up this pack
          _.each(machines, function(machineDef, _master) {
            var master = _master.split(':')[0];
            var version = _master.split(':')[1];
            // If our installed pack doesn't have this master, or has a
            // different version, replace it.
            if (!packageJson.machinepack.machineVersions[master] || packageJson.machinepack.machineVersions[master] !== version) {
              machineDef = JSON.parse(machineDef);
              // Try to get the default exit
              machineDef.defaultExit = machineDef.defaultExit ? (
                // It should come in as an exit ID, which we'll transform into the appropriate __varName__
                (machineDef.exits[machineDef.defaultExit] && machineDef.exits[machineDef.defaultExit].__varName__) ||
                // But in legacy cases it might be a __varName__ itself, so we'll check if there's an exit
                // that has that var name
                (_.find(machineDef.exits, {__varName__: machineDef.defaultExit}) && machineDef.defaultExit) ||
                // Otherwise we'll just say there isn't one
                undefined
              ) : undefined;
              machineDef.inputs = _.reduce(machineDef.inputs, normalize, {});
              machineDef.exits = _.reduce(machineDef.exits, normalize, {});
              // Make an error exit and make it the catchall
              delete machineDef.catchallExit;
              machineDef.exits.error = {"example": undefined};
              var machineModuleCode = "module.exports=" + stringify(machineDef) + ";";
              machineModuleCode = beautify(machineModuleCode, {indent_size: 2});
              fs.writeFileSync(path.join(machinesDir, machineDir, master + '.js'), machineModuleCode);
            }
            newPackageJson.machinepack.machineVersions[master] = version;
            newPackageJson.machinepack.machines.push(master);
          });
          // Output the package.json for this pack
          packageJsonStr = beautify(JSON.stringify(newPackageJson), {indent_size: 2});
          if (packageJsonStr == beautify(JSON.stringify(packageJson), {indent_size: 2})) {
            return nextPack();
          }

          fs.writeFileSync(path.join(machinesDir, machineDir, 'package.json'), packageJsonStr);
          // Write out the index file
          fs.writeFileSync(path.join(machinesDir, machineDir, 'index.js'), "module.exports = require('machine').pack({pkg: require('./package.json'), dir: __dirname});");
          return nextPack();
        }
      }, cb);

    }

  };











  function normalize(memo, def, id) {
    delete def.__friendlyName__;
    if (def.__varName__) {
      var varName = def.__varName__;
      delete def.__varName__;
      memo[varName] = def;
    } else {
      memo[id] = def;
    }
    return memo;
  }

  // TODO -- refactor the duplicative code
  function stringify(obj) {
    var str;
    if (Array.isArray(obj)) {
      str = "[\n";
      str += _.reduce(obj, function(memo, val) {
        var str = '';
        if (typeof val == 'object' && val !== null) {str += stringify(val);}
        else {str += JSON.stringify(val);}
        memo.push(str);
        return memo;
      }, []).join(",\n");
      str += "]";
    }
    else {
      str = "{\n";
      str += _.reduce(obj, function(memo, val, key) {
        var str = '"' + key +'": ';
        if (typeof val == 'object' && val !== null) {str += stringify(val);}
        else if (['getExample', '__getExample__', 'validate', 'fn'].indexOf(key) > -1) {
          if (key == 'fn') {
            if (!val || val.substr(0,8) != 'function') {
              val = 'function (inputs, exits, env) {' + (val || '') + '}';
            }
          } else {
            if (!val || val.substr(0,8) != 'function') {
              val = 'function (inputs, env, input) {' + (val || '') + '}';
            }
          }
          str += val;
        }
        else {str += JSON.stringify(val);}
        memo.push(str);
        return memo;
      }, []).join(",\n");
      str += "}\n";
    }
    return str;
  }


};
