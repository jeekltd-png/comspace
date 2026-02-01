E2E Testing (Cypress)

Quickstart (local):

1. Start the app with email debug enabled so tests can read reset tokens:

   DEBUG_EMAIL=true npm run dev

2. In a separate shell, run Cypress (headed):

   npm run e2e

3. To run headless E2E (local):

   npm run e2e:run

Notes:
- The backend exposes debug endpoints at `GET /__debug/emails` and `DELETE /__debug/emails` when `DEBUG_EMAIL=true`.
- The Cypress tests live under `cypress/e2e/` and use those debug endpoints to retrieve reset tokens.
- CI workflows (`.github/workflows/e2e.yml` and `e2e-dispatch.yml`) now set `DEBUG_EMAIL: 'true'` when starting the app for E2E runs.