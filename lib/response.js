module.exports = function sendResponse (options) {

  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  // If a status is provided, it must be an int, or consider this an error
  if (options.status) {
    options.status = parseInt(options.status, 10) || 500;
  }
  // Default to status 200.
  else {
    options.status = 200;
  }

  switch (options.action) {

    case 'respond_with_result_and_status':
    case 'respond_with_value_and_status':
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
      if (options.status === 200) {
        return res.send(200);
      } else {
        return res.negotiate({
          status: options.status,
          error: options.data
        });
      }
      break;

    case 'redirect':
      try {
        return res.redirect(options.data);
      } catch (e) {
        return res.send('Redirect error');
      }
      break;

    case 'display_view':
      return res.view(options.view, options.data);

    case 'not_implemented':
      return res.send(501);

    case 'compiler_error':
      return res.send(500,
        'This route ('+req.method.toUpperCase() + ' ' + req.url+') is in a broken or inconsistent state.  Please check it out on Treeline.io, fix the warnings indicated by the yellow and/or red "!" symbols, and then try this URL again.'
      );

  }

  return;

};
