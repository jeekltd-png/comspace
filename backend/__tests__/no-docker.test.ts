// set NO_DOCKER and SKIP_MEMDB in beforeAll to avoid leaking env to other test suites

import request from 'supertest';
import mongoose from 'mongoose';

// ensure mongoose.connect doesn't try to reach a real DB in CI
jest.spyOn(mongoose, 'connect').mockImplementation(async (..._args: any[]) => {
  // simulate a connected state
  (mongoose as any).connection.readyState = 1;
  return Promise.resolve(mongoose as any);
});

let app: any;
let redisClient: any;

jest.setTimeout(20000);

describe('NO_DOCKER dev flow', () => {
  beforeAll(async () => {
    // set NO_DOCKER for this suite only to avoid leaking env vars
    process.env.NO_DOCKER = 'true';

    // import server AFTER env var set
    const mod = await import('../src/server');
    app = mod.default;
    redisClient = mod.redisClient;

    // start server explicitly (test environment) and wait for it
    await mod.startServer();

    // re-read redisClient from the module (it is assigned after startup)
    redisClient = (await import('../src/server')).redisClient;

    // small delay to allow server startup in this test environment
    await new Promise((r) => setTimeout(r, 50));
  });

  afterAll(async () => {
    try {
      await mongoose.connection.close();
    } catch (e) {
      // noop
    }
    try {
      if (redisClient?.quit) await redisClient.quit();
    } catch (e) {
      // noop
    }

    // cleanup env vars to avoid affecting other suites
    delete process.env.NO_DOCKER;
  });

  test('GET /health returns healthy', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body.status).toBe('healthy');
  });

  test('mongoose is connected', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  test('redis mock set/get works', async () => {
    await redisClient.set('test-key', 'value');
    const val = await redisClient.get('test-key');
    expect(val).toBe('value');
  });
});