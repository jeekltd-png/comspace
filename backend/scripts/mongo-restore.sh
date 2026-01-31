#!/usr/bin/env bash
set -euo pipefail
MONGO_URI=${MONGO_URI:-mongodb://localhost:27017}
IN_DIR=${1:?Provide backup directory}

mongorestore --uri="$MONGO_URI" --drop "$IN_DIR"

echo "Restore complete from $IN_DIR"
