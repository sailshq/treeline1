/**
 * Post Install Script
 *
 * Handles running npm-install on any machine dependencies in api/machines
 */

// Module dependencies
var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');


(function() {

  var srcPath = path.resolve(__dirname, 'api/machines');

  // Check if the srcPath exists
  try {
    fs.lstatSync(srcPath);
  }

  // If the directory doesn't exist then gracefully exit
  catch(e) {
    process.exit(0);
  }

  var deps = fs.readdirSync(srcPath).filter(function(file) {
    return fs.statSync(path.join(srcPath, file)).isDirectory();
  });

  // Install a machine's dependencies
  function install() {
    var depPath = deps.pop();
    var childProcess = spawn('npm', ['update'], {
      cwd: path.resolve(srcPath, depPath)
    });

    childProcess.stdout.pipe(process.stdout);
    childProcess.on('close', function(code) {
      if (code) {
        console.log('!EXITING DUE TO NPM INSTALL ERRORS!');
        console.log('Please try running `npm install` again.');
        process.exit(1);
      }

      if (!deps.length) {
        process.exit(0);
      }

      // Recursively install the other dependencies
      install();
    });
  }

  // Kick on the install process
  install();
})();
