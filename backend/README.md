# Backend - Development notes

## No-Docker workflow
If Docker isn't available on your machine, use the `NO_DOCKER` fallback for quick local development.

- Install dev deps:

```bash
cd backend
npm install --legacy-peer-deps
```

- Start no-docker dev server:

```bash
npm run dev:no-docker
```

This spins up an in-memory MongoDB (via `mongodb-memory-server`) and a lightweight Redis mock.

## Quick tests
- Run unit tests (includes a NO_DOCKER smoke test):

```bash
cd backend
npm test
```

The test suite includes `__tests__/no-docker.test.ts` which asserts the `/health` endpoint, verifies a DB connection, and checks the Redis mock.

## Troubleshooting
- If the test times out waiting for MongoDB, make sure `npm install --legacy-peer-deps` completed successfully and that `mongodb-memory-server` is present in `node_modules`.
- If Redis tests fail, ensure the `redis-mock.ts` file exists and exports a compatible mock with `get`, `set`, `setEx`/`setex`, and `del`.

