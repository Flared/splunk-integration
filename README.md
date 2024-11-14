# Splunk Integration


## Requirements

At the time of this writing, Splunk Enterprise is at version 9.3.0. This version of splunk requires Python v3.9.

## Installation

Installation instructions are available [here](https://docs.flare.io/splunk-app-integration).

## Architecture Overview

The project contains a variety of packages that are published and versioned collectively. Each package lives in its own 
directory in the `/packages` directory. Each package is self contained, and defines its dependencies in a package.json file.

We use [Yarn Workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and [Lerna](https://github.com/lerna/lerna) for
managing and publishing multiple packages in the same repository.


## Development

If you have your own Splunk Enterprise installed locally, you can use

```
make splunk-local
```

to download the required dependencies, watch the file changes to re-compile on the fly and generate a symlink between the Splunk app and the Splunk Enterprise applications folder.

To be able to see your changes when refreshing, add this at the end of this file:
```
File: /Applications/Splunk/etc/system/local/web.conf

[settings]
cacheEntriesLimit = 0
cacheBytesLimit = 0
```
Then restart your Splunk Enterprise instance.
