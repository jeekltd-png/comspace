jest.setTimeout(20000);
process.env.NO_DOCKER = 'true';
// allow mongodb-memory-server to run so tests use in-memory DB
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
