module.exports = function sendResponse (options) {

  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  switch (options.action) {

    case 'respond_with_results_and_status':
      try {
        JSON.parse(options.data);
        res.json(options.status, options.data);
      }
      catch (e) {
        res.send(options.status, options.data);
      }
      break;

    case 'respond_with_status':
      res.negotiate({status: options.status, error: options.data});
      break;

    case 'redirect':
      res.redirect(options.url);
      break;

    case 'view':
      res.view(options.view, options.data);
      break;

  }

  return;

};
