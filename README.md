<h1>
  <a href="http://treeline.io" title="Treeline website"><img alt="Treeline logo" title="Treeline.io" src="http://i.imgur.com/lyxMr9Z.png" width="50" /></a>
  treeline (CLI)
</h1>


### [Website](http://treeline.io) &nbsp; [Reference](http://treeline.io/docs) &nbsp;  [FAQ](http://node-machine.org/implementing/FAQ)  &nbsp;  [Newsgroup](https://groups.google.com/forum/?hl=en#!forum/node-machine)

CLI tool for working with your Sails apps and machinepacks in Treeline.


## Installation &nbsp; [![NPM version](https://badge.fury.io/js/treeline.svg)](http://badge.fury.io/js/treeline)

```sh
$ npm install -g treeline
```

This will allow you to use `treeline` on the command-line, as well as `tl`, its alias.

## Usage

You should check out [http://treeline.io/docs](http://treeline.io/docs) for an in-depth tutorial, but here are a few highlights:

```bash
$ echo "TODO"
```

<!--
```bash
# open generated manpage on node-machine.org in your browser of choice
tl browse

# run a machine
# (theres an interactive prompt- you'll get to choose from a list, then be prompted to provide values for required inputs)
# (supports json entry and validation, re-running using command-line flags, and protects inputs marked as "protected" so they don't show up in your bash history)
mp exec

# clean everything up: (re)scaffold JSON test files, (re)generate readme using latest metadata, make sure repo url is in package.json, etc.
mp scrub

# list machines (useful for remembering wtf you're doing)
mp ls

# add new machine w/ identity="do-some-stuff" and start interactive prompt to get the rest of the necessary info
mp add do-some-stuff

# copy machine (useful for quickly creating similar machines)
mp cp foo bar

# rename machine (useful for fixing misspellings)
mp mv initiate-denk-party initiate-dance-party
```
-->

## About  &nbsp; [![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/node-machine/general?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Treeline is a project by the [Sails](http://sailsjs.org) core team to make Node.js more approachable.  Think about it like [blueprints](https://www.youtube.com/watch?v=GK-tFvpIR7c) for everything- web servers, APIs, background processes, devops scripts.  To learn more about the project, please visit [our website](http://treeline.io).

The underlying technology at work is mostly composed of a number of open-source modules which are a collaborative effort from the Sails.js and node-machine projects.

<a href="http://node-machine.org"><img src="http://node-machine.org/images/machine-anthropomorph-for-white-bg.png"/></a>
+
<a href="http://sailsjs.org"><img src="http://sailsjs.org/images/logo_sails.png"/></a>

If you are interested in contributing to any of these modules, please follow the directions outlined in the relevant repo(s).  Features, bug fixes, tests, documentation, or even proof-reading are all welcome :)


## License

&copy; 2013 Mike McNeil
&copy; 2014 The Treeline Company

All rights reserved.
