#!/usr/bin/env bash
set -euo pipefail
MONGO_URI=${MONGO_URI:-mongodb://localhost:27017}
OUT_DIR=${1:-./backups/$(date +%Y%m%d_%H%M%S)}
mkdir -p "$OUT_DIR"

mongodump --uri="$MONGO_URI" --out "$OUT_DIR"

echo "Backup saved to $OUT_DIR"
