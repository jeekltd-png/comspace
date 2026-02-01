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

describe('Pages API', () => {
  test('admin can create page and public can fetch it', async () => {
    const admin = await User.create({
      email: 'pageadmin@example.com',
      password: 'Password123!',
      firstName: 'Page',
      lastName: 'Admin',
      role: 'superadmin',
      tenant: 'default',
    });
    const token = generateToken(admin._id.toString(), 'default');

    const createRes = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: 'hello-world', title: 'Hello', body: '# Hi', published: true });

    expect(createRes.status).toBe(201);

    const publicRes = await request(app).get('/api/pages/hello-world');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.title).toBe('Hello');
  });
});