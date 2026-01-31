describe('Sentry debug route', () => {
  beforeEach(() => {
    // enable debug route
    process.env.DEBUG_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://example@sentry.test/1';
  });

  afterEach(async () => {
    delete process.env.DEBUG_SENTRY;
    delete process.env.SENTRY_DSN;
    jest.resetModules();
  });

  let app: any;

  test('GET /__debug/sentry triggers error middleware and Sentry.captureException', async () => {
    // Mock Sentry
    jest.doMock('@sentry/node', () => ({
      init: jest.fn(),
      captureException: jest.fn(),
    }));

    const request = require('supertest');
    // run in NO_DOCKER test mode (in-memory services)
    process.env.NO_DOCKER = 'true';
    process.env.SKIP_MEMDB = 'true';

    // require server after mocks so Sentry is initialized
    ({ default: app } = await import('../server'));

    const Sentry = require('@sentry/node');

    const res = await request(app).get('/__debug/sentry');
    expect(res.status).toBe(500);
    expect(Sentry.captureException).toHaveBeenCalled();

    // cleanup
    const { stopServer } = require('../server');
    await stopServer();
  });
});
