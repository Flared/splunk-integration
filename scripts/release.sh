#!/bin/bash

################################################################################
# Prepares a release: bumps the version in app.conf and opens the GitHub
# "new release" page with the tag prefilled.
#
# The tag must match app.conf, because publishing the release triggers
# .github/workflows/publish.yml, which packages main and ships it to Splunkbase.
#
# Override the computed version with:  VERSION=2.0.0 ./scripts/release.sh
################################################################################

set -e   # Stop script on errors

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
REPO_DIR="$( cd "$SCRIPT_DIR/.." >/dev/null 2>&1 && pwd )"
APP_CONF="$REPO_DIR/packages/flare_splunk_app/src/main/resources/splunk/default/app.conf"
RELEASE_URL="https://github.com/Flared/splunk-integration/releases/new"

cd "$REPO_DIR"

# ─── PRECONDITIONS ───────────────────────────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo "On branch '$BRANCH', but releases target main. Switch to main first."
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is dirty. The release ships origin/main, not your local state."
    echo "Commit or stash your changes first:"
    git status --short
    exit 1
fi
# ─────────────────────────────────────────────────────────────────────────────

# ─── DETERMINE VERSION ───────────────────────────────────────────────────────
CONF_VERSION=$(sed -n 's/^version = //p' "$APP_CONF" | head -1)
CONF_BUILD=$(sed -n 's/^build = //p' "$APP_CONF" | head -1)
LATEST_TAG=$(git tag --list 'v*' --sort=-v:refname | head -1)

# Prefer the latest tag as the previous version; fall back to app.conf when the
# repo has no tags yet.
if [ -n "$LATEST_TAG" ]; then
    PREVIOUS_VERSION="${LATEST_TAG#v}"
else
    PREVIOUS_VERSION="$CONF_VERSION"
fi

if [ -z "$PREVIOUS_VERSION" ] || [ -z "$CONF_BUILD" ]; then
    echo "Could not read the current version or build number from $APP_CONF"
    exit 1
fi

if [ -n "${VERSION:-}" ]; then
    NEXT_VERSION="$VERSION"
else
    IFS=. read -r MAJOR MINOR PATCH <<< "$PREVIOUS_VERSION"
    NEXT_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
fi

if ! [[ "$NEXT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Invalid version '$NEXT_VERSION'. Expected X.Y.Z (e.g. 2.0.0)."
    exit 1
fi

NEXT_BUILD=$((CONF_BUILD + 1))
TAG="v$NEXT_VERSION"

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
    echo "Tag $TAG already exists locally."
    exit 1
fi

if [ -n "$(git ls-remote --tags origin "refs/tags/$TAG")" ]; then
    echo "Tag $TAG already exists on origin."
    exit 1
fi
# ─────────────────────────────────────────────────────────────────────────────

# ─── CONFIRM ─────────────────────────────────────────────────────────────────
URL="$RELEASE_URL?tag=$TAG&target=main&title=$TAG"

echo "Previous version : $PREVIOUS_VERSION  (${LATEST_TAG:-no tags yet, from app.conf})"
echo "app.conf version : $CONF_VERSION (build $CONF_BUILD)"
echo "Next version     : $NEXT_VERSION (build $NEXT_BUILD)"
echo ""
# `|| REPLY=""` so EOF (non-interactive shell) aborts cleanly instead of tripping set -e.
read -r -p "Bump app.conf to $NEXT_VERSION and open the release page? [y/N] " REPLY || REPLY=""
if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
    echo "Aborted. Nothing changed."
    exit 0
fi
# ─────────────────────────────────────────────────────────────────────────────

# ─── BUMP app.conf ───────────────────────────────────────────────────────────
# Both the [id] and [launcher] stanzas carry the version; Splunk's build counter
# is incremented alongside it. Writing through a temp file avoids `sed -i`, whose
# syntax differs between BSD and GNU.
TMP_CONF=$(mktemp)
sed -e "s/^version = .*/version = $NEXT_VERSION/" \
    -e "s/^build = .*/build = $NEXT_BUILD/" \
    "$APP_CONF" > "$TMP_CONF"
mv "$TMP_CONF" "$APP_CONF"

echo ""
echo "Updated $APP_CONF:"
git --no-pager diff --unified=0 -- "$APP_CONF" | grep -E '^[-+](version|build) '
# ─────────────────────────────────────────────────────────────────────────────

echo "----------------------------------------------------------------"
echo "Commit and push the bump before publishing the release —"
echo "CI packages main, so the tag must point at the bumped commit."
echo "----------------------------------------------------------------"
echo "$URL"

if command -v open >/dev/null 2>&1; then
    open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
fi
