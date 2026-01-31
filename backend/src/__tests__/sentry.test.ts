describe('sentry util', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.SENTRY_DSN;
  });

  test('initSentry returns null when SENTRY_DSN is not set', () => {
    const { initSentry, getSentryClient } = require('../utils/sentry');
    const ret = initSentry();
    expect(ret).toBeNull();
    expect(getSentryClient()).toBeNull();
  });

  test('initSentry initializes Sentry when SENTRY_DSN is set', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.test/1';

    // provide a virtual mock for @sentry/node so test doesn't require the package
    jest.isolateModules(() => {
      jest.doMock('@sentry/node', () => ({
        init: jest.fn(),
        setTag: jest.fn(),
      }), { virtual: true });

      const { initSentry, getSentryClient, setSentryTag } = require('../utils/sentry');
      const sentry = initSentry();
      expect(sentry).not.toBeNull();
      // set a tag and ensure it doesn't throw
      expect(() => setSentryTag('env', 'test')).not.toThrow();
      expect(getSentryClient()).not.toBeNull();
    });
  });
});