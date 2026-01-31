jest.setTimeout(20000);
process.env.NO_DOCKER = 'true';
process.env.SKIP_MEMDB = 'true';

import request from 'supertest';
import mongoose from 'mongoose';
import User from '../models/user.model';
import { generateToken } from '../middleware/auth.middleware';

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

describe('Admin docs API', () => {
  test('admin can list and fetch docs', async () => {
    const admin = await User.create({
      email: 'admindocs@example.com',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'Docs',
      role: 'admin',
      tenant: 'default',
    });

    const token = generateToken(admin._id.toString(), 'default');

    const listRes = await request(app).get('/api/admin/docs').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const docs = listRes.body.data;
    if (docs.length > 0) {
      const docRes = await request(app).get(`/api/admin/docs/${docs[0]}`).set('Authorization', `Bearer ${token}`);
      expect(docRes.status).toBe(200);
      expect(docRes.body.data).toHaveProperty('content');
    }
  });

  test('merchant cannot access admin docs', async () => {
    const merchant = await User.create({
      email: 'merchantdocs@example.com',
      password: 'Password123!',
      firstName: 'Merchant',
      lastName: 'Docs',
      role: 'merchant',
      tenant: 'default',
    });

    const token = generateToken(merchant._id.toString(), 'default');

    const res = await request(app).get('/api/admin/docs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
