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

describe('Admin RBAC', () => {
  test('tiered admins and superadmin can access dashboard; customer cannot', async () => {
    const rolesAllowed = ['superadmin', 'admin', 'admin1', 'admin2', 'merchant'];
    for (const r of rolesAllowed) {
      const user = await User.create({
        email: `${r}@example.com`,
        password: 'Password123!',
        firstName: 'Role',
        lastName: r,
        role: r,
        tenant: 'default',
      });
      const token = generateToken(user._id.toString(), 'default');
      const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }

    const customer = await User.create({
      email: 'customer@example.com',
      password: 'Password123!',
      firstName: 'Customer',
      lastName: 'User',
      role: 'customer',
      tenant: 'default',
    });
    const custToken = generateToken(customer._id.toString(), 'default');
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${custToken}`);
    expect(res.status).toBe(403);
  });

  test('docs endpoint accessible to admin tiers and superadmin; merchant cannot', async () => {
    const rolesAllowed = ['superadmin', 'admin', 'admin1', 'admin2'];
    for (const r of rolesAllowed) {
      const user = await User.create({
        email: `docs-${r}@example.com`,
        password: 'Password123!',
        firstName: 'Docs',
        lastName: r,
        role: r,
        tenant: 'default',
      });
      const token = generateToken(user._id.toString(), 'default');
      const listRes = await request(app).get('/api/admin/docs').set('Authorization', `Bearer ${token}`);
      expect(listRes.status).toBe(200);
    }

    const merchant = await User.create({
      email: 'merchantdocs@example.com',
      password: 'Password123!',
      firstName: 'Merchant',
      lastName: 'Docs',
      role: 'merchant',
      tenant: 'default',
    });
    const tokenM = generateToken(merchant._id.toString(), 'default');
    const res = await request(app).get('/api/admin/docs').set('Authorization', `Bearer ${tokenM}`);
    expect(res.status).toBe(403);
  });

  test('seed-admins script creates expected users', async () => {
    // run seed script via import so it uses the current process's mongoose connection
    const seed = require('../../scripts/seed-admins');
    if (typeof seed.run === 'function') {
      await seed.run({ disconnectAfter: false });
    } else {
      throw new Error('seed-admins did not export run()');
    }

    const superadmin = await User.findOne({ role: 'superadmin' });
    const admin1 = await User.findOne({ role: 'admin1' });
    const admin2 = await User.findOne({ role: 'admin2' });

    expect(superadmin).toBeTruthy();
    expect(admin1).toBeTruthy();
    expect(admin2).toBeTruthy();
  });
});
