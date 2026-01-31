Branch: chore/e2e-sentry-checklist

Summary:
- Added Cypress E2E scaffolding and an example `login.cy.ts` test (visit home, navigate to /login, assert fields).
- Added `.github/workflows/e2e.yml` (Cypress GitHub Action) to run E2E on PRs to main.
- Wired Sentry into error handling and added unit tests for the Sentry util and error middleware.
- Added `docs/PRODUCTION_CHECKLIST.md` listing critical items before production and suggested assignees.
- Updated root `package.json` with `e2e` scripts and devDependencies (Cypress, start-server-and-test).

Files changed (high level):
- `cypress/` (config and test)
- `backend/src/utils/sentry.ts` (covered by tests)
- `backend/src/middleware/error.middleware.ts` (calls Sentry.captureException)
- `backend/src/__tests__/sentry.test.ts`
- `backend/src/__tests__/error.middleware.test.ts`
- `docs/PRODUCTION_CHECKLIST.md`
- `.github/workflows/e2e.yml`

Notes & Next Steps:
- Run `npm ci` at repo root to install Cypress and `start-server-and-test`.
- Locally run `npm run e2e` (open Cypress) or `npm run e2e:run` (headless) after starting dev servers.
- CI: since this repo doesn't have an `origin` remote set locally, push branch/changes to remote repo and open a PR titled: "chore: production checklist & e2e scaffolding" and assign reviewers: `@engineering-lead`, `@devops`, `@qa`, `@security`, `@observability`.

Assign owners for the production checklist tasks in `docs/PRODUCTION_CHECKLIST.md` and follow up with each team to schedule the work.
