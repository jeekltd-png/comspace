jest.setTimeout(20000);

// Provide a module mock for @sentry/node for this suite
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

describe('Sentry debug route', () => {
  beforeEach(() => {
    // enable debug route
    process.env.DEBUG_SENTRY = 'true';
    process.env.SENTRY_DSN = 'https://example@sentry.test/1';
    // use in-memory MongoDB for tests
    process.env.NO_DOCKER = 'true';
    delete process.env.SKIP_MEMDB;
  });

  afterEach(async () => {
    delete process.env.DEBUG_SENTRY;
    delete process.env.SENTRY_DSN;
    delete process.env.NO_DOCKER;
    jest.resetModules();
  });

  let app: any;

  test('GET /__debug/sentry triggers error middleware and Sentry.captureException', async () => {
    const request = require('supertest');

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
