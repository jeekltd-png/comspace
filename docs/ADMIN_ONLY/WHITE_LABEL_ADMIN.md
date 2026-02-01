# White Label — Admin Guide (Admin‑only) 🔧

This doc explains what admins can do to customize a tenant's store, which APIs to use, and provides concise examples for testing.

---

## Who is an Admin?
- Roles with access: **superadmin**, **admin**, **admin1**, **admin2**
- Admin routes are protected by `protect` middleware and `authorize('superadmin','admin','admin1','admin2')`.

---

## Admin UI (frontend)
- Path: `frontend/src/app/admin/white-label/ClientWhiteLabel.tsx`
- Actions available:
  - Upload **logo** and **hero** images
  - Set **domain** and **contact email**
  - Toggle features (delivery, pickup, reviews, wishlist)
  - Save config (PUT `/api/white-label/config/:tenantId`)

---

## API Reference — Quick Examples

### 1) Fetch branding (public)
No auth required.

curl example:
```
curl -H "X-Tenant-ID: fashion-lagos-2026" http://localhost:5000/api/white-label/config
```

Use this on storefront pages to render tenant branding.

### 2) Create config (admin)
Requires: Authorization Bearer token, tenant via header or subdomain.

Request:
```
POST /api/white-label/config
Authorization: Bearer <TOKEN>
Content-Type: application/json
{
  "domain": "yourstore.com",
  "contact": { "email": "support@yourstore.com" },
  "features": { "delivery": true }
}
```

### 3) Update config (admin)
```
PUT /api/white-label/config/:tenantId
Authorization: Bearer <TOKEN>
Content-Type: application/json
{"domain":"store.example","features":{"reviews":true}}
```

Example curl:
```
curl -X PUT http://localhost:5000/api/white-label/config/fashion-lagos-2026 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"domain":"yourstore.com","contact":{"email":"support@yourstore.com"}}'
```

### 4) Upload logo/hero (admin)
- Endpoint: `POST /api/white-label/upload` (multipart/form-data)
- Supported types: PNG, JPEG, WEBP
- Max size: currently 5MB on frontend validation

Example curl:
```
curl -X POST http://localhost:5000/api/white-label/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@./logo.png"
```

The API returns `{ data: { url: 'https://.../logo.png' } }` — save the returned URL into the white-label config under `branding.assets.logo.url`.

---

## Tenant awareness (important)
- Tenant detection is via subdomain (recommended) or `X-Tenant-ID` header.
- All admin actions should use the same tenant value to avoid mis-assignment of assets and data.
- Example header usage: `-H "X-Tenant-ID: fashion-lagos-2026"`.

---

## Local dev & testing helpers
- Dev-only admin creation & token helper:
  - `POST /__debug/create-admin` (only enabled when NODE_ENV !== 'production')
  - Example:
    ```json
    { "email":"e2e-admin@comspace.local","password":"E2EPass!23","role":"admin","tenant":"default" }
    ```
  - Response includes `token` and `refreshToken` for automated tests.

- Seed scripts (run in backend):
  - `backend/scripts/seed-admins.js` — idempotent-ish admin seeding
  - `backend/scripts/seed-demo.js` — demo tenant and sample data

Tip: When running E2E tests prefer the debug endpoint to create a test admin and obtain a token; this avoids seeding issues when an in-memory DB is used by the running server.

---

## Admin best practices & constraints
- GET `/api/white-label/config` is public so storefront pages can load branding without auth. Use tenant header/subdomain.
- Admin update routes are audited; avoid storing sensitive data in white-label config (branding should be non-sensitive assets and UI flags).
- Keep uploaded assets optimized (ideally < 200 KB for logos) to improve store load times.

---

## Troubleshooting
- 403 / 401 during admin actions:
  - Check Authorization header contains a valid token for an allowed role.
  - Confirm `X-Tenant-ID` matches the tenant you're updating.
- Upload failing with "Unsupported image type": verify `Content-Type` and file extension.
- If the running server uses an in-memory DB, run `POST /__debug/create-admin` against the server process to create an admin that the server will see immediately.

---

If you'd like, I can add: example Playwright/Cypress test snippets that call `/__debug/create-admin`, then upload an asset and update the config as part of an E2E flow. Want that added?