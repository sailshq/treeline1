module.exports = require('machine').pack({
  pkg: {
    machinepack: {
      machineDir: 'machines/',
      machines: [
        'read-keychain',
        'read-linkfile',
        'write-linkfile',
        'write-keychain',
        'authenticate',
        'ping-server',
        'fetch-pack',
        'list-apps',
        'list-packs',
        'fetch-pack-info',
        'add-postinstall-script',
        'login-if-necessary',
        'link-if-necessary',
        'start-developing-pack',
        'start-developing-app',
        'normalize-type',
        'sync-remote-changes',
        'apply-pack-changelog',
        'write-alias-dependency',
        'build-ascii-art',
        'connect-to-treeline',
        'fetch-project'
      ]
    }
  },
  dir: __dirname
});
