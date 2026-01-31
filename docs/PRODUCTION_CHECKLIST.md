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
