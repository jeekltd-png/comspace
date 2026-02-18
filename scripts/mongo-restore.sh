#!/bin/bash
# =============================================================================
# ComSpace MongoDB Restore Script
# =============================================================================
# Usage: ./mongo-restore.sh <backup_file.tar.gz>
# =============================================================================

set -euo pipefail

BACKUP_FILE="${1:?Error: Please provide backup file path as argument}"
RESTORE_DIR="/tmp/comspace-restore"
MONGO_HOST="${MONGO_HOST:-mongodb}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-comspace}"
MONGO_USER="${MONGO_USER:-admin}"
MONGO_PASSWORD="${MONGO_PASSWORD:?Error: MONGO_PASSWORD environment variable is required}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "================================================================"
echo "ComSpace MongoDB Restore"
echo "Backup file: ${BACKUP_FILE}"
echo "Target DB: ${MONGO_DB} on ${MONGO_HOST}:${MONGO_PORT}"
echo "================================================================"
echo ""
echo "WARNING: This will REPLACE all data in the ${MONGO_DB} database!"
read -p "Are you sure? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Extract backup
echo "[1/3] Extracting backup..."
mkdir -p "${RESTORE_DIR}"
tar -xzf "${BACKUP_FILE}" -C "${RESTORE_DIR}"
BACKUP_DIR=$(ls "${RESTORE_DIR}")

# Restore
echo "[2/3] Restoring to MongoDB..."
mongorestore \
  --host="${MONGO_HOST}" \
  --port="${MONGO_PORT}" \
  --username="${MONGO_USER}" \
  --password="${MONGO_PASSWORD}" \
  --authenticationDatabase=admin \
  --db="${MONGO_DB}" \
  --gzip \
  --drop \
  "${RESTORE_DIR}/${BACKUP_DIR}/${MONGO_DB}"

# Cleanup
echo "[3/3] Cleaning up temp files..."
rm -rf "${RESTORE_DIR}"

echo "================================================================"
echo "Restore complete!"
echo "================================================================"
