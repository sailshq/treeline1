<h1>
  <a href="http://treeline.io" title="Visit the Treeline website"><img alt="A line of geometric trees" title="Treeline.io logo" src="http://i.imgur.com/lyxMr9Z.png" width="100" /></a>
  treeline
</h1>


### [Website](http://treeline.io) &nbsp;  [Getting Started](http://node-machine.org) &nbsp; [Docs](https://treeline.io/documentation)  &nbsp;  [Newsgroup](https://groups.google.com/forum/?hl=en#!forum/node-machine)

Command-line utility for working with Sails apps and machines in Treeline.


## Installation &nbsp; [![NPM version](https://badge.fury.io/js/treeline.svg)](http://badge.fury.io/js/treeline)

```sh
$ npm install -g treeline
```

This will allow you to use `treeline` on the command-line, as well as `tl`, its alias.

## Usage [![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/node-machine/general?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

You should check out [https://treeline.io/documentation](https://treeline.io/documentation) for an in-depth tutorial, but here are a few highlights:

```bash
# locally preview the app in the current directory
$ treeline lift

# associate the current directory with an app on Treeline.io
$ treeline link

# authenticate this computer using your Treeline credentials
$ treeline login
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

## About  &nbsp;

Treeline is a project by the [Sails](http://sailsjs.org) core team to make Node.js more approachable.  Think about it like [blueprints](https://www.youtube.com/watch?v=GK-tFvpIR7c) for everything- web servers, APIs, background processes, devops scripts.  To learn more about the project, please visit [our website](http://treeline.io).

The underlying technology at work is mostly composed of a number of open-source modules which are a collaborative effort from the Sails.js and node-machine projects.

<h4>
  <a href="http://node-machine.org"><img width="50" src="http://node-machine.org/images/machine-anthropomorph-for-white-bg.png"/></a>
  <span>+</span>
  <a href="http://sailsjs.org"><img width="50" src="https://www.rosehosting.com/blog/wp-content/uploads/2014/03/sails.png"/></a>
</h4>

If you are interested in contributing to any of these modules, please follow the directions outlined in the relevant repo(s).  Feature requests, bug reports, patches, tests, documentation, or even proof-reads are all welcome :)


## The Treeline.io Beta

So... Treeline is not publicly available yet. We're working very hard to get ready for GA, especially on docs and examples.  For the latest release schedule, check out our website or @treeline on Twitter.

If you're interested in beta testing, please visit our website and sign up for early access.

> _If you're a Sails.js contributor still waiting on your beta code, hit me up on Twitter ([@mikermcneil](http://twitter.com/mikermcneil)) and I'll set up your account personally._


## Team
This module is developed and actively maintained with the help of these [contributors](https://github.com/treeline-io/cli/graphs/contributors):

[![Mike McNeil](http://gravatar.com/avatar/199046437b76e6ca73e00b4cc182a1c5?s=144)](http://michaelmcneil.com) |  [![Scott Gress](https://0.gravatar.com/avatar/b74e07aa543552709bf546ca279c9c67?s=144)](http://www.pigandcow.com/) | [![Cody Stoltman](https://1.gravatar.com/avatar/368567acca0c5dfb9a4ff512c5c0c3fa?s=144)](http://particlebanana.com) | [![Rachael Shaw](https://avatars0.githubusercontent.com/u/3065949?v=3&s=144)](http://twitter.com/fancydoilies) | [![Irl Nathan](https://avatars0.githubusercontent.com/u/1598650?v=3&s=144)](http://irlnathan.github.io/sailscasts/)
:---:|:---:|:---:|:---:|:---:
[Mike McNeil](http://michaelmcneil.com) | [Scott Gress](https://github.com/sgress454) | [Cody Stoltman](https://github.com/particlebanana) | [Rachael Shaw](https://github.com/rachaelshaw) | [Irl Nathan](https://github.com/irlnathan)



## License

The Treeline CLI tool is available under the MIT license.

&copy; 2013 Mike McNeil

&copy; 2014 The Treeline Company
