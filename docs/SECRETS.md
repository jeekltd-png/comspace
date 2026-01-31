# Secrets and environment variables

This file lists secrets needed for production and staging and how to add them to GitHub Actions and your platform.

Required secrets (minimum):
- `MONGODB_URI` — production MongoDB connection URI (with read/write user)
- `REDIS_URL` — Redis connection string (TLS where supported)
- `SENTRY_DSN` — Sentry project DSN for error reporting
- `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET` — Payment provider credentials
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Email provider
- `JWT_SECRET` — JWT signing secret
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — for backups (S3) if used

Add secrets to GitHub Actions:
- Repository > Settings > Secrets and variables > Actions > New repository secret
- Or use the CLI: `gh secret set NAME --body "value" --repo owner/repo`

Staging: set `SENTRY_DSN_STAGING` (we added a placeholder to this repo). For production set `SENTRY_DSN` in your production secrets store.

Notes:
- Rotate credentials regularly and restrict access.
- Store sensitive CI/CD secrets in a dedicated secret manager (e.g., HashiCorp Vault or cloud provider secrets) for higher security.
