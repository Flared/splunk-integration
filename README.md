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
We use an official splunk docker image for development, by binding the local folder to a folder in the container. In order for this to work, you need to have build the application before starting the docker.

```bash
make build
```

Then you can start the local docker and the frontend runner.

```bash
make splunk-local
```
