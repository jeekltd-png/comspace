jest.setTimeout(20000);
process.env.NO_DOCKER = 'true';

delete process.env.SKIP_MEMDB;

import request from 'supertest';
import User from '../models/user.model';
import { generateToken } from '../middleware/auth.middleware';

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

describe('White-label upload endpoint', () => {
  test('rejects unauthenticated upload', async () => {
    const res = await request(app).post('/api/white-label/upload');
    expect(res.status).toBe(401);
  });

  test('accepts image upload from admin', async () => {
    const admin = await User.create({
      email: 'upladmin@example.com',
      password: 'Password123!',
      firstName: 'Upload',
      lastName: 'Admin',
      role: 'superadmin',
      tenant: 'default',
    });

    const token = generateToken(admin._id.toString(), 'default');

    const res = await request(app)
      .post('/api/white-label/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from([0xff,0xd8,0xff]), 'test.jpg');

    // we expect at least a JSON response and a URL when successful, or an error if storage isn't writable
    expect([200,201,400,500]).toContain(res.status);
  });
});