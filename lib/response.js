module.exports = function sendResponse (options) {

  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  switch (options.action) {

    case 'respond_with_result_and_status':
      try {
        JSON.parse(options.data);
        res.json(options.status, options.data);
      }
      catch (e) {
        res.send(options.status, options.data);
      }
      break;

    case 'respond_with_status':
      if (options.status) {res.send(200);}
      else {res.negotiate({status: options.status, error: options.data});}
      break;

    case 'redirect':
      res.redirect(options.url);
      break;

    case 'view':
      res.view(options.view, options.data);
      break;

    case 'not_implemented':
      res.send(501);
      break;

  }

  return;

};
