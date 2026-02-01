Title: next-intl - fix: ensure getRequestConfig locale shape & prerender handling

Summary:
- Repro and suggested fix for next-intl runtime error when `getRequestConfig` does not return a `locale` in certain app-router prerender contexts.
- Minimal repro file included in `upstream/next-intl-repro` (node script and steps).

Proposed changes for upstream:
- Add a fallback in the runtime to treat missing `locale` as `undefined` gracefully and log a helpful message.
- Add unit tests in next-intl that assert the `getRequestConfig` return shape is validated, and preserve backward-compatibility.

How to open PR (using GitHub CLI):
1. Fork the `next-intl` repo if not already forked.
2. Create a branch: `git checkout -b fix/getRequestConfig-locale`.
3. Apply the patch files in `upstream/next-intl-repro/` to reproduce & test.
4. Push branch: `git push origin fix/getRequestConfig-locale`.
5. Open PR with `gh pr create --title "fix: robust handling when getRequestConfig lacks locale" --body-file upstream/next-intl-pr.md --base main`

Notes:
- See `upstream/next-intl-repro/` for the minimal repro and suggested runtime change.
- I prepared a draft patch locally (see `patches/next-intl-fallback.js`) — let me know if you want me to open the PR using GH CLI (requires your GH credentials configured locally).