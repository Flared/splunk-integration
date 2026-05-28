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
- **Yarn**: `1.x` (Classic) for workspace dependency management

Once the required versions are installed, you can proceed to install the project dependencies:

```bash
$ yarn setup
```

You’ll have two main directories, one for the created React page and one for the created Splunk app.

* `packages/configuration`
* `packages/flare`

## Splunk demo

Splunk demo will allow you to view your new app inside your local Splunk instance:

```bash
# navigate to your app folder
$ cd packages/flare

# link the app to your local Splunk instance
$ yarn link:app

# check that the link is set (optional)
$ ls -l $SPLUNK_HOME/etc/apps/flare

# restart Splunk (will start Splunk if not already started)
$ splunk restart

# navigate to the root project directory
$ cd ../../

# start the Splunk app
$ yarn start
```

This will watch both your `flare` and `configuration` folders for changes and rebundle.

You should now see your app in the left hand menu of the Splunk Enterprise home page, typically located at `https://localhost:8000`.

There is no hot-reloading within Splunk, you'll need to manually refresh the page to see changes.

If you are not seeing your changes you can try:
* hard reloading **Shift+Command+R** (Ctrl+Shift+R on Windows) in Google Chrome
* disabling Splunk asset cache (not recommended for production environments)
* using `https://localhost:8000/en-US/_bump`

For comprehensive instructions on configuring the index, modifying search macros, setting up proxies, leveraging saved searches, and exporting logs, please refer to the detailed **[Installation Guide and User Guide for Flare Splunk](https://docs.google.com/document/d/1VkZKqMMHkePH3HAfB1nB5G3NJ9SjGdV3T88ESpolUTY)** included in this repository.

## Support
For technical support, assistance with specific use cases, or additional guidance regarding the Flare Splunk Integration, please contact:
**Email**: [support@metronlabs.com](mailto:support@metronlabs.com)
