# Development setup

## Required environment variables
- `MONGODB_URI` (e.g., mongodb://localhost:27017/comspace)
- `REDIS_URL` (e.g., redis://localhost:6379) - optional, if not present some features will fallback but caching and token workflows may be limited
- `JWT_SECRET` (recommended)
- `JWT_REFRESH_SECRET` (recommended)
- `STRIPE_SECRET_KEY` (if testing payments)
- `FRONTEND_URL` (for email links)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (if testing Google OAuth)

## Local Redis
- Option A: install Redis locally and run `redis-server`.
- Option B: use Docker:

```bash
docker run -d --name comspace-redis -p 6379:6379 redis:7
```

## Docker Compose (recommended for local dev) ✅
If you want a single command to bring up Redis and MongoDB (and MailHog for email testing), use the included `docker-compose.yml` at the repo root.

- Start services:

```bash
docker-compose up -d
```

- The compose file exposes MongoDB at `mongodb://localhost:27017` and Redis at `redis://localhost:6379`.
- After the services are up, run the usual dev flow:

```bash
npm install --legacy-peer-deps
npm run dev
```

This is often the fastest way to get a reproducible dev environment across teammates.

## No-Docker development (Windows-friendly)
If Docker is not available on your machine (or you'd rather not use it), you can run a local no-Docker dev flow that uses an in-memory MongoDB and a lightweight Redis mock for convenience.

- Install dev dependencies:

```bash
cd backend
npm install --legacy-peer-deps
```

- Start the backend in no-docker mode (uses an in-memory MongoDB and Redis mock):

```bash
cd backend
npm run dev:no-docker
```

- To seed sample data (creates a sample owner account, store, category and products):

```bash
cd backend
npm run seed:sample
```

Notes:
- This mode is intended for fast onboarding and local development, but it does not replace full integration testing. CI still uses Docker Compose for full-stack smoke tests.
- If you need persistent data or a real Redis instance, set `NO_DOCKER` to `false` and run Docker or connect to a remote service (see `MONGODB_URI` and `REDIS_URL` in `.env.example`).
- Remember to run `npm run smoke` in CI or a Docker-enabled machine for end-to-end verification.

---


## Run the app (recommended)
- Install dependencies at the repo root:

```bash
npm install --legacy-peer-deps
```

- Start both services (uses `run-p`):

```bash
npm run dev
```

- Backend dev: `cd backend && npm run dev` (uses nodemon + ts-node)
- Frontend dev: `cd frontend && npm run dev`

## Notes & troubleshooting
- If you see `ECONNREFUSED` for Redis, either start Redis or set `REDIS_URL` to a reachable instance.
- If you see duplicate mongoose index warnings, remove duplicate index declarations from the model files (we use `unique`/`index` in field definitions where appropriate).
- We replaced `concurrently` dev orchestration with `npm-run-all` (`run-p`) to avoid nested dependency issues; if you need `concurrently` specifically, reinstall it and ensure its nested `date-fns` contains compiled JS files (or run `npm install` again in the root).

## Quick smoke test (manual)
- Health: GET http://localhost:5000/health
- Register: POST http://localhost:5000/api/auth/register
  - body: `{ "email": "you@example.com", "password": "Password123!", "firstName": "Test", "lastName": "User" }`

## Contact
- If anything fails during local startup, share `dev-run.log` and I can help further.
