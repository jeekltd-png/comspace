jest.setTimeout(20000);
process.env.NO_DOCKER = 'true';
process.env.SKIP_MEMDB = 'true';

import request from 'supertest';
import mongoose from 'mongoose';
import User from '../models/user.model';

// prevent real mongoose connections in test environment
jest.spyOn(mongoose, 'connect').mockImplementation(async (..._args: any[]) => {
  (mongoose as any).connection.readyState = 1;
  return Promise.resolve(mongoose as any);
});

let app: any;

beforeAll(async () => {
  ({ default: app } = await import('../server'));
});

afterAll(async () => {
  const { stopServer } = require('../server');
  await stopServer();
});

describe('verify email and reset password flows (Redis-backed)', () => {
  test('verifyEmail uses Redis token', async () => {
    // create user
    const user = await User.create({
      email: 'verifytest@example.com',
      password: 'Password123!',
      firstName: 'Verify',
      lastName: 'Test',
      tenant: 'default',
    });

    // write token into redis (server exposes RedisMock in NO_DOCKER)
    const { redisClient } = require('../server');
    const token = 'test-verify-token';
    await redisClient.setEx(`verify:${token}`, 60, user._id.toString());

    const res = await request(app).get(`/api/auth/verify/${token}`);
    expect(res.status).toBe(200);

    const updated = await User.findById(user._id);
    expect(updated?.isVerified).toBe(true);
  });

  test('resetPassword uses Redis token', async () => {
    const user = await User.create({
      email: 'resettest@example.com',
      password: 'Password123!',
      firstName: 'Reset',
      lastName: 'Test',
      tenant: 'default',
    });

    const { redisClient } = require('../server');
    const token = 'test-reset-token';
    await redisClient.setEx(`reset:${token}`, 60, user._id.toString());

    const res = await request(app).post(`/api/auth/reset/${token}`).send({ password: 'NewPass123!' });
    expect(res.status).toBe(200);

    const updated = await User.findById(user._id).select('+password');
    expect(updated).not.toBeNull();
    // ensure password changed (comparePassword)
    const ok = await updated!.comparePassword('NewPass123!');
    expect(ok).toBe(true);
  });
});
