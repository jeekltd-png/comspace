# Production Readiness Checklist

This file tracks the remaining critical items required before promoting ComSpace to production.

## Critical (must complete before production)
- [ ] Managed Redis provisioned and `REDIS_URL` set (Assign: @devops)
- [ ] Secure secrets management (JWT secrets, Stripe keys, Sentry DSN, SMTP, DB creds) (Assign: @security)
- [ ] MongoDB - backups and restore procedures configured (Assign: @db-admin)
- [ ] Sentry configured with DSN and Alerts (Assign: @observability)
- [x] CI e2e and smoke tests passing on PRs (scaffolded; Assign: @qa)
- [ ] Load testing (k6/artillery) + documented targets (Assign: @performance)
- [ ] Security review / pentest sign-off (Assign: @security)
- [x] Branch protection requires CI and admin approval checks (configured; Assign: @engineering-lead)

## Important
- [ ] E2E tests for critical flows (login, checkout, payments, webhooks) (Assign: @qa)
- [ ] Centralized logging and dashboards (Assign: @observability)
- [ ] Dependency vulnerability scanning enabled (Dependabot / Snyk) (Assign: @engineering-lead)
- [ ] Documented rollback runbook (Assign: @devops)

## Nice-to-have
- [ ] Performance budgets in CI
- [ ] Multi-region deployment and failover plan
- [ ] Automated DB migrations with tests

---

When ready, open a PR titled: "chore: production checklist & e2e scaffolding" and assign reviewers: @engineering-lead, @devops, @qa, @security, @observability.

## Env validation (new)
- There is a lightweight env validator at `backend/scripts/validate-prod-env.js` and an NPM script `backend` script `check:env` (run with `npm --prefix backend run check:env`).
- A GitHub Actions workflow `.github/workflows/check-prod-env.yml` runs this check using repository secrets (add `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` to repo secrets). The workflow will fail the check if required secrets are missing.
- Use `backend/.env.production.example` as the template for your `.env.production` file.

## Notes
- Ensure `SENTRY_DSN` is set in staging/production if you want Sentry events; add it as a repo secret for CI as well.
- Remove any local `node_modules` patches (e.g., temporary edits to `next-intl`) and prefer configuration or package upgrades instead of local edits.
