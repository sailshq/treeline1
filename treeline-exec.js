#!/usr/bin/env node

/**
 * Module dependencies
 */

var program = require('commander');
var chalk = require('chalk');
var Machinepacks = require('machinepack-machines');
var Machine = require('machine');
var _ = require('lodash');
var yargs = require('yargs');

// Build CLI options
var cliOpts = yargs.argv;
delete cliOpts._;
delete cliOpts.$0;

program
  .usage('[options]')
  .parse(process.argv);


(Machine.build({
  inputs: {},
  defaultExit: 'success',
  exits: {
    success: {
      example: {
        machinepack: {
          identity: 'machinepack-whatever',
          variableName: 'Whatever'
        },
        machine: {
          identity: 'do-stuff',
          variableName: 'doStuff'
        },
        withInputs: [
          {
            name: 'foobar',
            value: 'fiddle diddle'
            // ^^^^^ this is ok because it's always a string entered on the CLI interactive prompt
          }
        ],
        exited: {
          exit: 'success',
          jsonValue: '{"stuff": "things"}',
          inspectedValue: '{stuff: "things"}',
          void: false
        }
      }
    },
    error: {},
    invalidMachine: {
      example: {
        machine: 'do-stuff'
      }
    }
  },
  fn: function (inputs, exits) {

    var util = require('util');
    var inquirer = require('inquirer');
    var Http = require('machinepack-http');
    var Npm = require('machinepack-npm');
    var Machines = require('machinepack-machines');
    var enpeem = require('enpeem');

    console.log();
    console.log();
    console.log('Preview machine from registry');
    console.log('================================');
    console.log();

    var REGISTRY_BASE_URL = 'http://node-machine.org';


    // Look up list of machinepacks
    Http.sendHttpRequest({
      baseUrl: REGISTRY_BASE_URL,
      url: '/machinepacks'
    }).exec({
      error: exits.error,
      success: function (resp){

        var machinepacks;
        try {
          machinepacks = JSON.parse(resp.body);
        }
        catch (e){
          return exits.error(e);
        }

        inquirer.prompt([{
          name: 'machinepackIdentity',
          message: 'Please choose a machinepack',
          type: 'list',
          choices: _.reduce(machinepacks, function (memo, pack){
            memo.push({
              name: pack.friendlyName,
              value: pack.identity
            });
            return memo;
          }, [])
        }], function (answers){

          // Now we have a `machinepackIdentity`
          var machinepackIdentity = answers.machinepackIdentity;

          // Look up list of machines within this machinepack
          Http.sendHttpRequest({
            baseUrl: REGISTRY_BASE_URL,
            url: util.format('/%s', machinepackIdentity)
          }).exec({
            error: exits.error,
            success: function (resp){

              var machinepack;
              try {
                machinepack = JSON.parse(resp.body);
              }
              catch (e){
                return exits.error(e);
              }

              inquirer.prompt([{
                name: 'machineIdentity',
                message: 'Now choose a machine to run',
                type: 'list',
                choices: _.reduce(machinepack.machines, function (memo, machine){
                  memo.push({
                    name: machine.friendlyName,
                    value: machine.identity
                  });
                  return memo;
                }, [])
              }], function (answers){

                // Now we have a `machineIdentity`
                var machineIdentity = answers.machineIdentity;

                Http.sendHttpRequest({
                  baseUrl: REGISTRY_BASE_URL,
                  url: util.format('/%s/%s', machinepackIdentity, machineIdentity)
                }).exec({
                  error: exits.error,
                  notOk: exits.error,
                  success: function (resp){

                    var machine;
                    try {
                      machine = JSON.parse(resp.body);
                    }
                    catch (e){
                      return exits.error(e);
                    }

                    console.log();
                    console.log('Fetching code for NPM module "%s"@%s...',machinepack.npmPackageName, machinepack.version);
                    Npm.downloadPackage({
                      name: machinepack.npmPackageName,
                      version: machinepack.version
                    }).exec({
                      error: exits.error,
                      success: function (machinepackPath){


                        // Set present working directory to the `machinepackPath`
                        // (remembering the previous cwd for later)
                        var cwd = process.cwd();
                        process.chdir(machinepackPath);

                        console.log('Installing NPM dependencies for %s...',machinepackIdentity);
                        enpeem.install({
                          dependencies: [],
                          loglevel: 'silent'
                        }, function (err){
                          if (err) return exits.error(err);

                          // Return to previous present working directory
                          process.chdir(cwd);

                          console.log();
                          console.log('Running %s...',machineIdentity);
                          console.log();
                          Machines.runMachineInteractive({
                            machinepackPath: machinepackPath,
                            identity: machineIdentity,
                            // TODO: allow cmdline args to be provided
                            // inputValues: (function (){
                            //   return _.reduce(cliOpts, function (memo, inputValue, inputName){
                            //     memo.push({
                            //       name: inputName,
                            //       value: inputValue,
                            //       protect: false
                            //     });
                            //     return memo;
                            //   }, []);
                            // })()
                          }).exec({
                            error: function (err){
                              return exits.error(err);
                            },
                            invalidMachine: function (){
                              return exits.invalidMachine();
                            },
                            success: function (result){
                              return exits.success(_.extend({
                                machine: {
                                  identity: machineIdentity,
                                  variableName: machine.variableName
                                },
                                machinepack: {
                                  identity: machinepackIdentity,
                                  variableName: machinepack.variableName
                                }
                              },result));
                            }
                          });
                        });
                      }
                    });
                  }
                });
              });
            }
          });
        });
      }
    });
  }
})).exec({
  error: function (err){
    console.error('Unexpected error occurred:\n',typeof err === 'object' && err instanceof Error ? err.stack : err);
  },
  invalidMachine: function (err){
    console.error('Cannot run machine `'+chalk.red(err.machine)+'`. Machine is invalid.  Error details:\n',err);
  },
  success: function (result){

    console.log('___'+repeatChar('_')+'_˛');
    console.log('   '+repeatChar(' ')+'  ');
    console.log('   '+chalk.gray('%s.%s()'), chalk.bold(chalk.white(result.machinepack.variableName)), chalk.bold(chalk.yellow(result.machine.variableName)));

    // console.log('');
    // console.log(chalk.white(' * * * * * * * * * * * * * * * * * * * * * * * * '));
    // console.log(chalk.white(' *                  OUTCOME                    * '));
    // console.log(chalk.white(' * * * * * * * * * * * * * * * * * * * * * * * * '));
    // console.log('');
    // console.log(' using input values:\n', chalk.bold(chalk.yellow(identity)), _.reduce(result.withInputs, function(memo, configuredInput) {

    // console.log(' Used input values:\n', _.reduce(result.withInputs, function(memo, configuredInput) {
    console.log('  ');
    console.log(_.reduce(result.withInputs, function(memo, configuredInput) {
      memo += '   » ' + chalk.white(configuredInput.name) + ' ' + chalk.gray(JSON.stringify(configuredInput.value));
      memo += '\n';
      return memo;
    }, ''));
    console.log('___'+repeatChar('_')+'_¸ ');
    console.log('  | ');

    // console.log(' Triggered '+chalk.blue(result.exited.exit)+' callback'+(function (){
    //   if (!result.exited.void) {
    //     return ', returning:\n ' + chalk.gray(result.exited.jsonValue);
    //   }
    //   return '.';
    // })());

    // Determine chalk color
    var exitColor = (function (){
      if (result.exited.exit === 'error') {
        return 'red';
      }
      if (result.exited.exit === 'success') {
        return 'green';
      }
      return 'blue';
    })();

    console.log('  '+chalk.bold(chalk[exitColor]('•'))+' \n  The machine triggered its '+chalk.bold(chalk[exitColor](result.exited.exit))+' exit'+(function (){
      if (!result.exited.void) {
        return ' and returned a value:\n   '+chalk.gray(result.exited.inspectedValue);
      }
      return '.';
    })());
    console.log();
    console.log();
    console.log(chalk.white(' To run again:'));
    console.log(chalk.white((function (){
      var cmd = ' treeline exec '+result.machinepack.identity + '/' + result.machine.identity;
      _.each(result.withInputs, function (configuredInput){

        // Skip protected inputs (they need to be re-entered)
        if (configuredInput.protect) return;

        cmd += ' ';
        cmd += '--'+configuredInput.name+'=\''+configuredInput.value.replace(/'/g,'\'\\\'\'')+'\'';
      });
      return cmd;
    })()));
    console.log();
  }
});




/**
 * private helper fn
 * @param  {[type]} char  [description]
 * @param  {[type]} width [description]
 * @return {[type]}       [description]
 */
function repeatChar(char,width){
  width = width || 60;
  var borderStr = '';
  for (var i=0;i<width;i++) {
    borderStr += char;
  }
  return borderStr;
}
