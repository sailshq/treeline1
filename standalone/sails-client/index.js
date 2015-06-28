/**
 * Module dependencies
 */

var socketIOClient = require('socket.io-client');
var sailsIOClient = require('sails.io.js');


// Example usage:
//
// var socket = getSocketAndConnect({baseUrl:'https://api.treeline.io'}, function (err, socket) {
  // ...
  // // Send a GET request to `http://localhost:1337/hello`:
  // socket.get('/hello', function serverResponded (body, JWR) {
  //   console.log('Sails responded with: ', body);
  //   console.log('with headers: ', JWR.headers);
  //   console.log('and with status code: ', JWR.statusCode);
  //   ...
  //   // Now disconnect (notice there's no callback)
  //   socket.disconnect();
  //   ...
  //   // If you need to know when we actually got disconnected, use
  //   // something like async.whilst() and the `isConnected()` method.
  //   if (socket.isConnected()) {
  //     ...
  //   }
  // });
// });


module.exports = function getSocketAndConnect(opts, cb){
  opts = opts || {};
  if (!opts.baseUrl) {
    return cb(new Error('opts.baseUrl is required!'));
  }
  opts.timeout = opts.timeout || 5000;

  // Instantiate the socket client (`io`)
  // (for now, you must explicitly pass in the socket.io client when using this library from Node.js)
  var io = sailsIOClient(socketIOClient);

  // Set some options:
  io.sails.autoConnect = false; // <= prevent a socket from being automatically connected
  io.sails.environment = 'production';    // <= disable log output

  var socket = io.sails.connect(opts.baseUrl, {
    multiplex: false,          //<= prevent weird entanglement if this happens to get required more than once
    transports: ['websocket']  //<= only use WebSockets (no need for long-polling, etc-- this isn't a browser.)
  });


  var isDoneAlready;
  var alarm = setTimeout(function (){
    if (isDoneAlready){
      return;
    }
    isDoneAlready = true;
    try {
      socket.disconnect();
    }
    catch (e) {
      console.error('Additional error disconnecting socket:',e);
    }
    return cb(new Error('Took too long to connect.  Are you sure your internet connection is working?  Or maybe the server is not online, or not accepting WebSocket traffic.  It is also possible the server is just slow, in which case you should increase the `timeout` option.'));
  }, opts.timeout);

  socket.on('connect', function (){
    if (isDoneAlready){
      return;
    }
    isDoneAlready = true;
    clearTimeout(alarm);
    return cb(null, socket);
  });


};
