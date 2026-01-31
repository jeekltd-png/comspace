# Database backup & restore (MongoDB)

This document describes recommended approaches to backup and restore MongoDB for Comspace.

Recommendations
- Use a managed DB provider (MongoDB Atlas, AWS DocumentDB, etc.) which provides automated backups and point-in-time recovery (PITR).
- If self-hosting, schedule `mongodump` backups to a secure object store (S3, Google Cloud Storage) and exercise restores regularly.

Quick commands (local / self-hosted)
- Backup: `MONGO_URI="mongodb://localhost:27017" ./backend/scripts/mongo-backup.sh ./backups/latest`
- Restore: `MONGO_URI="mongodb://localhost:27017" ./backend/scripts/mongo-restore.sh ./backups/latest`

Verification
- Run a restore in a separate staging cluster and validate application functionality before promoting snapshots to production.

Notes
- Keep backups encrypted and ensure access is limited to your operations team. Store secrets in your secrets manager.
