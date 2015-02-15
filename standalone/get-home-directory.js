/**
 * Get absolute path to the home directory in an OS-agnostic way
 */

module.exports = function getHomeDirectory () {
  return process.env[
    (process.platform == 'win32') ?
    'USERPROFILE' :
    'HOME'
  ];
};
