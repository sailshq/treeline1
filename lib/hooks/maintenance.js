/**
 * maintenance hook
 */

module.exports = function(sails) {

  return {
    initialize: function(cb) {

      sails.on('router:before', function () {

        sails.router.bind('all /*', function (req, res, next) {
          if (sails.config.maintenance) {
            return res.send("Please wait while Shipyard updates your project");
          }
          return next();
        });

      });

      cb();

    }

  };
};
