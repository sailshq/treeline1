module.exports = function sendResponse (options) {

  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  switch (options.action) {

    case 'respond_with_result_and_status':
      try {
        JSON.parse(options.data);
        res.status(options.status);
        return res.json(options.data);
      }
      catch (e) {
        res.status(options.status);
        return res.send(options.data);
      }
      break;

    case 'respond_with_status':
      if (options.status) {res.send(200);}
      else {res.negotiate({status: options.status, error: options.data});}
      break;

    case 'redirect':
      res.redirect(options.redirectUrl);
      break;

    case 'display_view':
      res.view(options.view, options.data);
      break;

    case 'not_implemented':
      res.send(501);
      break;

    case 'compiler_error':
      res.send(500, "There was an error compiling this route!");
      break;

  }

  return;

};
