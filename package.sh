#!/bin/bash

################################################################################
# This is a script for generating an installable app package for Splunk.
# It ensures the build is fresh by removing local development artifacts.
################################################################################

set -e   # Stop script on errors

# Set up build variables
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PACKAGE_DIR=$SCRIPT_DIR/dist
REQUIREMENTS_FILE="$SCRIPT_DIR/requirements.txt"
PYTHON="${PYTHON:-python}"

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
# Install the runtime dependencies (requirements.txt) into bin/lib/ so the app
# is self-contained. bin/lib is the exact path the Python modules add to sys.path.
echo "Vendoring runtime dependencies into stage/bin/lib..."
"$PYTHON" -m pip install -r "$REQUIREMENTS_FILE" --target="$SRC_DIR/bin/lib" --quiet --upgrade

# Strip compiled binaries (e.g. charset_normalizer's mypyc .so files): AppInspect
# rejects undeclared binaries, and the packages fall back to their pure-Python .py
# sources. Platform-specific binaries wouldn't run on the Splunk server anyway.
find "$SRC_DIR/bin/lib" \( -name '*.so' -o -name '*.pyd' -o -name '*.dylib' \) -delete

echo "Runtime dependencies vendored successfully."
# ─────────────────────────────────────────────────────────────────────────────

# For local development we only need the assembled, runnable app in stage/ —
# skip building the distributable tarball.
if [ -n "${SKIP_TARBALL:-}" ]; then
    find "$SRC_DIR" -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null || true
    find "$SRC_DIR" -name '*.pyc' -delete 2>/dev/null || true
    echo "----------------------------------------------------------------"
    echo "SKIP_TARBALL set — runnable app assembled at: $SRC_DIR"
    echo "----------------------------------------------------------------"
    exit 0
fi

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

# Creating the tarball (.tgz)
cd $PACKAGE_DIR
FILENAME="$APP_FOLDER-${COMMIT_ID}.tgz"
# COPYFILE_DISABLE/--no-xattrs: keep macOS bsdtar from emitting AppleDouble
# ._* entries (from xattrs like com.apple.provenance), which fail AppInspect
COPYFILE_DISABLE=1 tar --no-xattrs -czf $FILENAME $APP_FOLDER

# Cleanup the temporary folder after zipping
rm -rf $FULLAPP_DIR

echo "----------------------------------------------------------------"
echo "SUCCESS: Package created at: $PACKAGE_DIR/$FILENAME"
echo "----------------------------------------------------------------"
