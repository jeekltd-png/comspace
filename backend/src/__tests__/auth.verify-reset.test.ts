jest.setTimeout(20000);
process.env.NO_DOCKER = 'true';
// allow mongodb-memory-server to run so tests use in-memory DB
delete process.env.SKIP_MEMDB;

import request from 'supertest';
import User from '../models/user.model';


let app: any;

beforeAll(async () => {
  const mod = await import('../server');
  ({ default: app } = mod);
  await mod.startServer();
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

    const res = await request(app).get(`/api/auth/verify-email/${token}`);
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

    const res = await request(app).post(`/api/auth/reset-password/${token}`).send({ password: 'NewPass123!' });
    expect(res.status).toBe(200);

    const updated = await User.findById(user._id).select('+password');
    expect(updated).not.toBeNull();
    // ensure password changed (comparePassword)
    const ok = await updated!.comparePassword('NewPass123!');
    expect(ok).toBe(true);
  });
});
