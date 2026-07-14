#!/bin/bash

################################################################################
# This is a script for generating an installable app package for Splunk.
# It ensures the build is fresh by removing local development artifacts.
################################################################################

set -e   # Stop script on errors

# Set up build variables
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PACKAGE_DIR=$SCRIPT_DIR/dist
TA_VERSION_FILE="$SCRIPT_DIR/ta_version.txt"

# Clean previous builds
rm -rf $PACKAGE_DIR/*
mkdir -p $PACKAGE_DIR

# Identification
COMMIT_ID=$(git rev-parse --short=6 HEAD 2>/dev/null || echo "local")
APP_FOLDER="flare"
REAL_SRC_DIR=$SCRIPT_DIR/packages/flare/src/main/resources/splunk
SRC_DIR=$SCRIPT_DIR/packages/flare/stage
FULLAPP_DIR=$PACKAGE_DIR/$APP_FOLDER

echo "Building package for $APP_FOLDER (Commit: $COMMIT_ID)..."

mkdir -p $FULLAPP_DIR

# ─── SYNC src → stage ────────────────────────────────────────────────────────
# Always sync the real source into stage before packaging.
echo "Syncing src → stage..."
# Delete old backend folders to prevent stale files, but preserve appserver/ which holds compiled frontend assets
rm -rf "$SRC_DIR/bin" "$SRC_DIR/default" "$SRC_DIR/metadata" "$SRC_DIR/lookups"
cp -R "$REAL_SRC_DIR"/. "$SRC_DIR/"
# Remove Python bytecode artifacts that shouldn't be packaged
find "$SRC_DIR" -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null || true
find "$SRC_DIR" -name '*.pyc' -delete 2>/dev/null || true
echo "Sync complete."
# ─────────────────────────────────────────────────────────────────────────────

# ─── VENDOR PYTHON DEPENDENCIES ──────────────────────────────────────────────
# Install the official flareio SDK into bin/lib/ so the .tgz is self-contained.
echo "Vendoring flareio SDK into stage/bin/lib..."
pip install flareio "urllib3<2" "requests<2.32.0" --target="$SRC_DIR/bin/lib" --quiet --upgrade

echo "SDK vendored successfully."
# ─────────────────────────────────────────────────────────────────────────────

cp -R $SRC_DIR/* $FULLAPP_DIR/

echo "Cleaning local development artifacts..."

rm -rf $FULLAPP_DIR/local
rm -rf $FULLAPP_DIR/metadata/local.meta

rm -rf $FULLAPP_DIR/lookups/*.csv

# Remove specific unnecessary UI files
rm -rf $FULLAPP_DIR/default/data/ui/nav/default-ia.xml


echo "Purging newly generated pip install bytecode artifacts..."
find "$FULLAPP_DIR" -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null || true
find "$FULLAPP_DIR" -name '*.pyc' -delete 2>/dev/null || true
# ─────────────────────────────────────────────────────────────────────────────

# Get version from File
if [ -f "$TA_VERSION_FILE" ]; then
    APP_VERSION=$(<$TA_VERSION_FILE)
else
    APP_VERSION="1.0.0"
    echo "Warning: $TA_VERSION_FILE not found, defaulting to $APP_VERSION"
fi

# Creating the tarball (.tgz)
cd $PACKAGE_DIR
FILENAME="splunk-$APP_FOLDER-app-v${APP_VERSION}-${COMMIT_ID}.tgz"
tar -czf $FILENAME $APP_FOLDER

# Cleanup the temporary folder after zipping
rm -rf $FULLAPP_DIR

echo "----------------------------------------------------------------"
echo "SUCCESS: Package created at: $PACKAGE_DIR/$FILENAME"
echo "----------------------------------------------------------------"