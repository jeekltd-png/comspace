# White Label Demo — Seed & Run (Local)

This guide seeds a complete demo tenant, creates a demo admin, a store, category and products, and shows how to view assets and run the app locally.

---

## What the demo includes
- Tenant: `demo-company-2026`
- Admin user: `demo-admin@demo.local` / `DemoPass!23`
- White-label branding with demo logo & hero image (placeholder URLs)
- One store (code `DEMOSTORE`)
- Category `Apparel`
- Products: `DEMO-TSHIRT-001`, `DEMO-HOODIE-001`

Assets used in the demo (external placeholders):
- Logo: https://via.placeholder.com/240x80.png?text=Demo+Company+Logo
- Hero image: https://via.placeholder.com/1200x400.png?text=Demo+Hero+Image
- Product images: https://via.placeholder.com/600x400.png?text=Demo+T-Shirt (and Hoodie)

Sample video (public sample):
- Big Buck Bunny (small): https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4

---

## How to seed the demo tenant
1. Start or ensure your backend can connect to MongoDB (use `NO_DOCKER=true` if using local dev server with in-memory DB):

```powershell
# Run from repo root
npm --prefix backend run seed:demo-tenant
```

You should see output confirming created admin and resources. Note the script uses `MONGODB_URI` if set.

---

## How to inspect the demo data
- White-label config (public):
```bash
curl -H "X-Tenant-ID: demo-company-2026" http://localhost:5000/api/white-label/config
```

- List products (public API):
```bash
curl -H "X-Tenant-ID: demo-company-2026" http://localhost:5000/api/products
```

- Admin login (to get token) using the seeded admin credentials:
```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"demo-admin@demo.local","password":"DemoPass!23"}'
```

The login response contains `token` which can be used for protected admin API calls.

---

## Viewing in Chrome (quick demo)
Browsers do not allow custom headers by default. To view the tenant site in Chrome with tenant-aware branding, do one of the following:

1) Use a header extension (e.g., "ModHeader") to add header: `X-Tenant-ID: demo-company-2026`, then open `http://localhost:3000` (frontend dev server). The site should render with demo branding for the tenant.

2) Use curl to fetch API responses and view images directly:
```bash
curl -H "X-Tenant-ID: demo-company-2026" http://localhost:5000/api/white-label/config | jq
```
Then open the returned `branding.assets.logo.url` in Chrome.

---

## Demo text & video for marketing page
You can copy the following into an example marketing page for the demo tenant.

Title: "Demo Company — Ethical Apparel"

Summary: "Demo Company is a small apparel brand delivering comfortable, sustainable clothing to customers worldwide. Explore our curated collection and shop with confidence."

Hero video embed: `https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4`

Call to Action: "Shop Demo Collection"

---

## Notes
- The demo uses external placeholder images and a public sample video to keep the repo small. Replace these assets with your own uploads via the admin White Label UI or upload endpoint for a realistic demo.
- If your backend uses an in-memory Mongo started by the server process, seed the tenant while the server is running (the debug admin endpoint may be easier for that flow).

---

If you want, I can add an example marketing page under `frontend/src/app/demo/page.tsx` that renders the demo branding, hero image, sample video, and links to the product listing so you can "run the app in Chrome" and see the demo store end-to-end. Done — the demo page is available at `/demo` and supports `?tenant=demo-company-2026`. Open your browser to `http://localhost:3000/demo?tenant=demo-company-2026` after seeding and starting the frontend.

I also added a Cypress E2E test `cypress/e2e/white-label-admin.cy.ts` that:
- Calls `POST /__debug/create-admin` to create a test admin
- Logs in via the UI
- Uploads a logo using `cypress/fixtures/logo.png` and saves config
- Confirms the backend white-label config contains the uploaded asset
- Visits `/demo?tenant=demo-company-2026` and checks the demo page renders the logo

Run Cypress with your usual dev setup, e.g. `npx cypress open` or `npx cypress run` after starting backend + frontend servers.