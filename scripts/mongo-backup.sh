#!/bin/bash
# =============================================================================
# ComSpace MongoDB Automated Backup Script
# =============================================================================
# Usage: ./mongo-backup.sh
# Recommended: Run via cron daily at 2 AM
#   0 2 * * * /path/to/scripts/mongo-backup.sh >> /var/log/comspace-backup.log 2>&1
# =============================================================================

set -euo pipefail

# Configuration (override via environment variables)
BACKUP_DIR="${BACKUP_DIR:-/backups/mongodb}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
MONGO_HOST="${MONGO_HOST:-mongodb}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-comspace}"
MONGO_USER="${MONGO_USER:-admin}"
MONGO_PASSWORD="${MONGO_PASSWORD:?Error: MONGO_PASSWORD environment variable is required}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-comspace-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="comspace_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "================================================================"
echo "ComSpace MongoDB Backup - ${TIMESTAMP}"
echo "================================================================"

# Perform mongodump
echo "[1/5] Starting mongodump..."
mongodump \
  --host="${MONGO_HOST}" \
  --port="${MONGO_PORT}" \
  --username="${MONGO_USER}" \
  --password="${MONGO_PASSWORD}" \
  --authenticationDatabase=admin \
  --db="${MONGO_DB}" \
  --out="${BACKUP_PATH}" \
  --gzip

echo "[2/5] Backup created at ${BACKUP_PATH}"

# Create compressed archive
echo "[3/5] Compressing backup..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

BACKUP_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
echo "      Compressed size: ${BACKUP_SIZE}"

# Upload to S3 if configured
if [ -n "${S3_BUCKET}" ]; then
  echo "[4/5] Uploading to S3: s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_NAME}.tar.gz"
  aws s3 cp "${BACKUP_NAME}.tar.gz" "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_NAME}.tar.gz" \
    --storage-class STANDARD_IA
  echo "      Upload complete."
else
  echo "[4/5] S3_BUCKET not set — skipping cloud upload."
fi

# Clean up old backups
echo "[5/5] Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "comspace_*.tar.gz" -mtime "+${BACKUP_RETENTION_DAYS}" -delete
REMAINING=$(ls -1 "${BACKUP_DIR}"/comspace_*.tar.gz 2>/dev/null | wc -l)
echo "      ${REMAINING} backup(s) retained locally."

echo "================================================================"
echo "Backup complete: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"
echo "================================================================"
