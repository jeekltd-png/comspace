process.env.NO_DOCKER = 'true';
process.env.SKIP_MEMDB = 'true';

import request from 'supertest';
import mongoose from 'mongoose';

// ensure mongoose.connect doesn't try to reach a real DB in CI
jest.spyOn(mongoose, 'connect').mockImplementation(async (..._args: any[]) => {
  // simulate a connected state
  (mongoose as any).connection.readyState = 1;
  return Promise.resolve(mongoose as any);
});

import app, { redisClient } from '../src/server';

jest.setTimeout(20000);

describe('NO_DOCKER dev flow', () => {
  beforeAll(async () => {
    // small delay to allow server startup in this test environment
    await new Promise((r) => setTimeout(r, 200));
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