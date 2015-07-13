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
        'list-apps',
        'list-packs',
        'add-postinstall-script',
        'login-if-necessary',
        'link-if-necessary',
        'start-developing-project',
        'normalize-type',
        'sync-remote-changes',
        'apply-pack-changelog',
        'build-ascii-art',
        'connect-to-treeline',
        'fetch-project',
        'fetch-and-subscribe-to-project',
        'link',
        'unlink',
        'login',
        'logout',
        'export-pack',
        'lift-preview-server',
      ]
    }
  },
  dir: __dirname
});
