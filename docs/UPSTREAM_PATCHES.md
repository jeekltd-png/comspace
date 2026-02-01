# Upstream Patch & PR Guidance

This project may include temporary local workarounds (e.g., for `next-intl`) applied during debugging. Long-term we should:

1. Identify local patches
   - Run: `node backend/scripts/scan-node-patches.js` to heuristically find likely local edits inside `node_modules`.

2. Create minimal reproducer and tests
   - Add a small unit test or repo example that reproduces the issue with the latest package version.
   - For example, if `next-intl` throws when no config file is present, create a minimal app dir setup demonstrating the thrown error.

3. Prepare the patch
   - Make minimal source changes in a fork of the package or branch the upstream repo.
   - Add tests and documentation that explain the issue and the fix.

4. Submit PR to upstream
   - Include the reproducer and tests. Reference this repo and label it `compatibility` or `bug`.
   - If required, propose a small fix or add a defensive fallback (but prefer to follow package API and guidance).

5. Revert local patches
   - After upstream accepts or publishes a new version, remove local edits and bump package in `package.json`.

If you'd like, I can prepare a draft PR patch for `next-intl` (based on our observations) and a minimal repro test — say whether you want me to draft the PR and I will prepare the changes and instructions to open the PR.