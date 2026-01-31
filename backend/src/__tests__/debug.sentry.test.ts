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

  test('GET /__debug/sentry triggers error middleware and Sentry.captureException', async () => {
    // Mock Sentry
    jest.doMock('@sentry/node', () => ({
      init: jest.fn(),
      captureException: jest.fn(),
    }));

    const request = require('supertest');
    // require server after mocks so Sentry is initialized
    const { app } = require('../simple-server');

    const Sentry = require('@sentry/node');

    const res = await request(app).get('/__debug/sentry');
    expect(res.status).toBe(500);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
