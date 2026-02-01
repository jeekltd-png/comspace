Title: fix(next-intl): don't throw when request config missing locale — fallback to default locale

Summary:
When `getRequestConfig` does not return a `locale` (or when `next-intl` can't find the expected `next-intl.config` file), the runtime throws "Couldn't find next-intl config file..." during prerender. This causes build failures in environments where middleware isn't run or where the config isn't discovered. This PR proposes a defensive fallback that: 1) logs a clear warning and 2) falls back to a `defaultLocale` from the `next-intl` config (if present) instead of throwing, to avoid hard failures.

Reproduction steps:
1. Checkout minimal repro in `upstream/next-intl-repro/repro.js`.
2. Run `node repro.js` (in a repo with `next-intl` installed). It will call `getRequestConfig` with a config that does not return a `locale` and shows the thrown message.

Suggested fix (high level):
- In `server/react-server/getRequestConfig.js` wrap the logic where it throws the error and instead:
  - attempt to read `next-intl.config` from workspace root or frontend root, and if `defaultLocale` exists, return `{ locale: defaultLocale, messages: {} }` (and emit a `console.warn` explaining fallback), or
  - if no config found, throw a more informative error pointing to a suggested fallback and docs.

Proposed tests:
- Unit test that simulates `getRequestConfig` returning no `locale` and asserts that the function returns a fallback object rather than throwing and logs a warning.

Notes:
- This change is defensive; it should not change behavior for properly configured apps but prevents hard build failures for apps that rely on client-only routing or where middleware isn't run during static prerendering.

Patch guidance:
- Add test and fix in the upstream package test suite (e.g., mocha/jest specific to next-intl).
- If upstream prefers stricter behavior, ensure a clear opt-in (e.g., env var) or explicit docs update.

I can prepare a small patch based on the above and include the test in this repo for review and to apply as a temporary local patch until upstream merges the fix.