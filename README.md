# Flare Splunk Integration

## Overview

The **Flare Splunk Integration** is a specialized app designed to seamlessly pull security event data from the [Flare](https://flare.io/) platform directly into your Splunk environment. This application bridges the gap between external digital risk protection intelligence and Splunk's powerful analytics capabilities, enabling security teams to maintain real-time awareness of emerging threats, leaked credentials, and vulnerabilities from the dark web.

## Key Features

- **Automated Event Ingestion:** Automatically retrieve high-fidelity continuous threat exposure events from the Flare API based on a scheduled interval.
- **Dynamic Configuration UI:** Securely manage API keys, proxy settings, backfill days, and tenant selections directly within Splunk.
- **Pre-Built Dashboards:** Includes an **Executive Overview Dashboard** with dynamic severity drilldowns to detailed event tables, and an **Application Logs Dashboard** for administrators to monitor the health and performance of the integration.

## Getting started

**Prerequisites:**

- **Node.js**: `>= 22` (required by project configuration)
- **pnpm**: `9.x` or later for workspace dependency management

Once the required versions are installed, you can proceed to install the project dependencies:

```bash
$ pnpm run setup
```

You’ll have two main directories, one for the created React page and one for the created Splunk app.

- `packages/configuration`
- `packages/flare_splunk_app`

## Splunk demo

Splunk demo will allow you to view your new app inside your local Splunk instance:

```bash
# navigate to your app folder
$ cd packages/flare_splunk_app

# link the app to your local Splunk instance
$ pnpm run link:app

# check that the link is set (optional)
$ ls -l $SPLUNK_HOME/etc/apps/flare_splunk_app

# restart Splunk (will start Splunk if not already started)
$ splunk restart

# navigate to the root project directory
$ cd ../../

# start the Splunk app
$ pnpm run start
```

This will watch both your `flare` and `configuration` folders for changes and rebundle.

You should now see your app in the left hand menu of the Splunk Enterprise home page, typically located at `https://localhost:8000`.

There is no hot-reloading within Splunk, you'll need to manually refresh the page to see changes.

If you are not seeing your changes you can try:

- hard reloading **Shift+Command+R** (Ctrl+Shift+R on Windows) in Google Chrome
- disabling Splunk asset cache (not recommended for production environments)
- using `https://localhost:8000/en-US/_bump`

For comprehensive instructions on configuring the index, modifying search macros, setting up proxies, leveraging saved searches, and exporting logs, please refer to the detailed **[Installation Guide and User Guide for Flare Splunk](https://docs.google.com/document/d/1VkZKqMMHkePH3HAfB1nB5G3NJ9SjGdV3T88ESpolUTY)** included in this repository.

## Building & CI

The build is driven by `make`, and the exact same targets run in GitHub Actions
and locally. `package.sh` is the single packaging tool; `make` orchestrates it.

| Command         | What it does                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------- |
| `make ci`       | Full pipeline (what CI runs): build → package → tooling → lint → validate → test.            |
| `make build`    | Compile the frontend into `packages/flare_splunk_app/stage/`.                                           |
| `make package`  | Vendor the Python runtime deps and produce the installable app at `dist/*.tgz`.              |
| `make validate` | Run Splunk AppInspect against the packaged `dist/*.tgz`.                                     |
| `make lint`     | ESLint + Stylelint + mypy + Prettier check.                                                  |
| `make format`   | Auto-format (Prettier + Ruff).                                                               |
| `make test`     | Run the workspace test suites.                                                               |
| `make clean`    | Remove build artifacts (`dist/`, `stage/`, `venv-tools/`, vendored `lib/`, `node_modules/`). |

Prerequisites for `make`: Node.js `>= 22`, `pnpm` `9.x`, Python `3.9`, and Docker
(for `make splunk-local`). AppInspect needs `libmagic` (`brew install libmagic` on macOS).

### Local Splunk via Docker

```bash
$ make splunk-local
```

This builds the app, vendors the Python dependencies into `packages/flare_splunk_app/stage`,
starts a Splunk container (compose mounts `packages/flare_splunk_app/stage` as the app), and
runs the webpack watcher. Open `https://localhost:8000` to view the app. This is
an alternative to the `pnpm run link:app` symlink flow above and does not require
a local Splunk installation.

## Support

For technical support, assistance with specific use cases, or additional guidance regarding the Flare Splunk Integration, please contact:
**Email**: [support@metronlabs.com](mailto:support@metronlabs.com)
