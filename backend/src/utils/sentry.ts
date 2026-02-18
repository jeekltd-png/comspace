export let SentryClient: any = null;

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  // lazy require so CI/dev without DSN won't need it installed
  // (but it's in package.json so it'll be available in install)
  /* eslint-disable @typescript-eslint/no-var-requires */
  const Sentry = require('@sentry/node');
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Filter sensitive headers before sending to Sentry (Fix #5)
    beforeSend(event: any) {
      // Remove Authorization headers to prevent token leakage
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['Authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },
  });
  SentryClient = Sentry;
  return SentryClient;
};

export const getSentryClient = () => SentryClient;

export const setSentryTag = (key: string, value: string) => {
  try {
    if (SentryClient && SentryClient.setTag) {
      SentryClient.setTag(key, value);
    }
  } catch (e) {
    // noop
  }
};