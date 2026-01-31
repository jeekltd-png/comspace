# Branch Protection & Admin-only Docs Guide (Admin-only)

This document explains how to protect `docs/ADMIN_ONLY/` and ensure changes are reviewed and approved by admins only.

## Goals
- Prevent direct pushes to `main` and require pull requests for all changes.
- Ensure any change to `docs/ADMIN_ONLY/` gets **explicit admin approval** before a merge.
- Enforce required status checks (CI, admin approval check), signed commits, and required reviews.

## 1) Add CODEOWNERS (already present)
We already have `.github/CODEOWNERS` with:
```
/docs/ADMIN_ONLY/ @comspace-admins
```
This ensures CODEOWNERS are requested for PR reviews when files under `docs/ADMIN_ONLY/` change. Replace `@comspace-admins` with your actual GitHub team or usernames.

## 2) Set Branch Protection rules for `main` (UI)
Navigate to: Repository Settings → Branches → Add rule (Branch name pattern: `main`) and configure:
- Require pull request reviews before merging: **ON**
  - Require approving reviews: 1 or 2 (choose your policy)
  - Require review from Code Owners: **ON**
- Require status checks to pass before merging: **ON**
  - Add checks: `build`, `lint`, `test`, **`Admin Approval Check`** (see workflow below)
- Require signed commits: **ON** (optional but recommended)
- Require linear history: **ON** (optional)
- Restrict who can push to matching branches: add a limited list of teams/users (e.g., `maintainers`, `admins`)

Note: enabling "Require review from Code Owners" will auto-request review from the team/item in CODEOWNERS.

## 3) Admin-approval check (automation)
To make it explicit and enforceable, add the GitHub Action `.github/workflows/admin-approval-check.yml`. It fails the check if a PR modifies `docs/ADMIN_ONLY/` but does not have the `admin-approved` label. Then require this check in Branch Protection as a required status check.

- How to use:
  - Admins add the `admin-approved` label to PRs that have been reviewed/approved by an admin (or an admin can manually apply the label).
  - The workflow runs on each PR and enforces the policy programmatically.

## 4) Pull Request template & workflow linkage
- Add `.github/PULL_REQUEST_TEMPLATE.md` that includes an author checklist and a reminder to request admin approval when modifying admin-only docs.
- When `Admin Approval Check` is required in Branch Protection, PRs will block merge until the label is present and the check passes.

## 5) Enforcement & recovery
- If the check fails on a PR that needs admin review, request an admin CodeOwner review or have an admin add the `admin-approved` label after verifying changes.
- For emergency changes, temporarily allow a specific admin to push directly, but prefer PR + review for traceability.

## 6) Example `gh` commands (optional)
- Create branch protection using `gh` (requires admin tokens and repository access) - see GitHub docs. In many orgs this is easiest to do via the UI.

## 7) Notes
- This guide assumes you will use the `admin-approved` label workflow. You can customize label name or require different checks if desired.
- Keep this file under `docs/ADMIN_ONLY` and ensure it is CODEOWNERS-protected.
