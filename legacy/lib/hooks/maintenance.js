/**
 * maintenance hook
 */

module.exports = function(sails) {

  return {
    initialize: function(cb) {

      sails.on('router:before', function () {

        sails.router.bind('all /*', function (req, res, next) {
          if (sails.config.maintenance) {
            return res.send('<html><head><meta http-equiv="refresh" content="2"></head><body>Please wait while Treeline updates your project (page will automatically reload)...</body></html>');
          }
          return next();
        });

      });

      cb();

    }

  };
};
