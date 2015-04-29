var depIds = [<<DEPIDS>>];
var spawn = require('child_process').spawn;
var path = require('path');

(function install() {

  var depId = depIds.pop();
  var childProcess = spawn("npm", ["update"], {
    cwd: path.resolve(__dirname, "machines", depId)
  });
  childProcess.stdout.pipe(process.stdout);
  childProcess.on('close', function(code) {
    if (code) {
      console.log("!EXITING DUE TO NPM INSTALL ERRORS!");
      console.log("Please try running `npm install` again.");
      process.exit(1);
    }
    if (!depIds.length) {
      process.exit(0);
    }
    install();
  });

})();
