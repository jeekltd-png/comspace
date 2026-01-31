jest.setTimeout(10000);

describe('error handler and Sentry', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.SENTRY_DSN;
  });

  test('calls Sentry.captureException when available', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.test/1';

    jest.isolateModules(() => {
      jest.doMock('@sentry/node', () => ({
        init: jest.fn(),
        captureException: jest.fn(),
      }), { virtual: true });

      const { initSentry } = require('../utils/sentry');
      initSentry();

      // require middleware fresh so it picks up the Sentry client
      const { errorHandler, CustomError } = require('../middleware/error.middleware');

      // create fake req/res
      const req: any = { originalUrl: '/test', method: 'GET', ip: '127.0.0.1' };
      const res: any = {
        status: jest.fn(() => res),
        json: jest.fn(() => res),
      };
      const next = jest.fn();

      const err = new CustomError('boom', 500);
      const Sentry = require('@sentry/node');

      errorHandler(err, req, res, next);

      // ensure Sentry.captureException was called
      expect(Sentry.captureException).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });
});