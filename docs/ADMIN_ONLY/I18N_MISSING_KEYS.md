# Missing Translation Reports (Dev-only)

This endpoint allows you to collect and inspect missing translation keys reported by the frontend. It's intentionally limited to non-production environments and requires `DEBUG_I18N=true` to accept reports.

Endpoints

- POST /__debug/missing-translations
  - Body: { tenant?: string, locale: string, keys: string[], url?: string, userAgent?: string, source?: string }
  - Example:
    curl -X POST http://localhost:5000/__debug/missing-translations \
      -H "Content-Type: application/json" \
      -d '{"tenant":"default","locale":"es","keys":["home.hero.title","home.hero.subtitle"],"url":"http://localhost:3000"}'

- GET /__debug/missing-translations?tenant=demo-company-2026&locale=es&limit=50
  - Returns array of recent reports (most recent first)

How to enable

- Set `DEBUG_I18N=true` in your dev environment (e.g., `.env.local`) and restart the backend.
- The endpoint will return 404 when `NODE_ENV=production` or `DEBUG_I18N` is not `true`.

How to use with Cypress

- The test `cypress/e2e/home-translation.cy.ts` asserts that human-readable text is rendered and raw keys are not visible. If you want to exercise reporting, add a client-side call from console or tests that POSTs missing keys to `/__debug/missing-translations`.

Notes

- Reports are stored in the `MissingTranslation` collection and are intentionally simple to keep this lightweight (timestamped documents with tenant, locale, keys, url, userAgent).
- Consider adding an administrative UI or scheduled export for long-term monitoring if you want to keep historical metrics across environments.