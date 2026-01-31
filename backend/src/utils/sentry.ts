export let SentryClient: any = null;

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  // lazy require so CI/dev without DSN won't need it installed
  // (but it's in package.json so it'll be available in install)
  /* eslint-disable @typescript-eslint/no-var-requires */
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn, tracesSampleRate: 0.0 });
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