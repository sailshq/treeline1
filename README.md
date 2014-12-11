treeline
====

This is an alpha-version command-line interface for integrating with the Treeline.io tool.

By default, CLI options such as the API URL are stored in ~/.treeline-cli.json.

You may change the location of that file by adding a .treelinerc file to your project with:
```
{
   "cliConfigPath": "/path/to/your/cli/options/file"
}
```

Typically the simplest way to have a project connect to a different Treeline instance than the default is by specifying that the .treelinerc and CLI config be the same:
{
  "cliConfigPath": "/path/to/this/.treelinerc/file",
  "pathToCredentials": "/path/to/treeline/api/credentials/file",
  "treelineURL": "http://mytreelineinstance.io"
}


## License

Proprietary.
All rights reserved.
&copy; Dec 2014
The Treeline Company
