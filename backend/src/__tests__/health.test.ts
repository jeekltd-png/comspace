jest.setTimeout(30000);

import request from 'supertest';
import { stopServer } from '../server';
import mongoose from 'mongoose';

// prevent real mongoose connections in test environment
jest.spyOn(mongoose, 'connect').mockImplementation(async (..._args: any[]) => {
  (mongoose as any).connection.readyState = 1;
  return Promise.resolve(mongoose as any);
});

let app: any;

beforeAll(async () => {
  // set NO_DOCKER and SKIP_MEMDB for this suite only
  process.env.NO_DOCKER = 'true';
  process.env.SKIP_MEMDB = 'true';

  // require server after mocks are in place and wait for startup
  const mod = await import('../server');
  ({ default: app } = mod);
  await mod.startServer();
});

afterAll(async () => {
  await stopServer();

  delete process.env.NO_DOCKER;
  delete process.env.SKIP_MEMDB;
});

describe('GET /health', () => {
  it('returns health payload with version, commit and deps', async () => {
    // Poll /health until deps report connected (in NO_DOCKER mode startup may be async)
    const maxTries = 20;
    let res: any;
    for (let i = 0; i < maxTries; i++) {
      res = await request(app).get('/health');
      if (res.status === 200 && res.body?.deps?.mongo && res.body?.deps?.redis) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    // ensure we actually got a response
    expect(res).toBeDefined();

    expect(res!.status).toBe(200);
    expect(res!.body).toHaveProperty('status', 'healthy');
    expect(typeof res!.body.uptime).toBe('number');
    expect(res!.body).toHaveProperty('version');
    expect(res!.body).toHaveProperty('commit');
    expect(res!.body).toHaveProperty('deps');
    expect(res!.body.deps).toHaveProperty('mongo');
    expect(res!.body.deps).toHaveProperty('redis');
    // in test/NO_DOCKER mode these should report connected
    expect(res!.body.deps.mongo).toBe(true);
    expect(res!.body.deps.redis).toBe(true);
  });
});