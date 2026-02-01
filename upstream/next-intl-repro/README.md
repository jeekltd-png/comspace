This folder contains a minimal reproduction and suggested fix for the `next-intl` runtime error "Couldn't find next-intl config file" encountered during prerendering in the Comspace app.

Usage:
1. Ensure `next-intl` is installed in the project (this is a repo-local repro).
2. Run `node repro.js` to see the failure mode (it attempts to call the `getRequestConfig` wrapper and simulates missing config).

The intended upstream PR would:
- Add a clearer error message and
- Add a safe fallback for environments where a config file is missing by returning a default `locale` (from `next-intl.config.*`) instead of throwing.

See `../docs/next-intl-draft-pr.md` for the proposed PR text and diffs.