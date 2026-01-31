<!-- Pull Request Template -->

## Summary
<!-- Describe what this PR does -->

## Checklist
- [ ] Tests added / updated (unit & e2e)
- [ ] Lint passed
- [ ] CI passed
- [ ] Documentation updated

**Admin-only docs:**
- [ ] If this PR modifies `docs/ADMIN_ONLY/`, I confirm admin approval is requested and/or `admin-approved` label has been applied.

> If the PR modifies `docs/ADMIN_ONLY/` and you are not an admin, request a code owner review from the admin team before merging.

## PR details for this change
- Added E2E (Cypress) scaffolding and example login test
- Added Sentry unit tests and example configuration
- Added `docs/PRODUCTION_CHECKLIST.md` with remaining items and suggested assignees

**Run e2e locally:** `npm run e2e` (start dev first) or `npm run e2e:run` for headless.
