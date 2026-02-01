#!/usr/bin/env bash
set -euo pipefail

# Script to open a PR against next-intl using GH CLI
# Requires: gh (https://cli.github.com/) configured with push access to your fork

PATCH_DIR="upstream/next-intl-repro"
BRANCH="fix/getRequestConfig-locale"
UPSTREAM_REPO="vercel/next-intl"

echo "This script will create a branch, apply local patches (if any) and open a PR against ${UPSTREAM_REPO}."
read -p "Continue? (y/N) " ans
if [[ "$ans" != "y" && "$ans" != "Y" ]]; then
  echo "Aborted"
  exit 1
fi

# Create local branch
git checkout -b "$BRANCH"

# (Optional) Apply patch files from $PATCH_DIR
if [ -d "$PATCH_DIR" ]; then
  echo "Applying patches from $PATCH_DIR"
  git apply "$PATCH_DIR"/*.patch || true
fi

# Commit changes
git add -A
git commit -m "fix(next-intl): gracefully handle missing locale in getRequestConfig (test + fix)" || true

echo "Pushing to origin/$BRANCH"
git push origin "$BRANCH"

echo "Opening PR via gh"
gh pr create --title "fix(next-intl): handle missing locale in getRequestConfig" --body-file "$PATCH_DIR/PR_BODY.md" --base main --head $(git rev-parse --abbrev-ref HEAD)

echo "Done. Opened PR against ${UPSTREAM_REPO} (if gh configured)."