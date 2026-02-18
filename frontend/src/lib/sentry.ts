/**
 * Sentry initialization for the frontend.
 * 
 * Install: pnpm add @sentry/nextjs
 * 
 * This module is imported early in the app to capture errors.
 */

let SentryBrowser: any = null;

export function initSentry() {
  if (typeof window === 'undefined') return;
  
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.info('[Sentry] No DSN configured — error reporting disabled');
    return;
  }

  try {
    // Dynamic import to avoid bundle bloat when Sentry isn't configured
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const loadSentry = new Function('return import("@sentry/nextjs")') as () => Promise<any>;
    loadSentry().then((Sentry: any) => {
      Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: process.env.NODE_ENV || 'development',
        // Filter sensitive data before sending
        beforeSend(event: any) {
          // Remove cookies and auth headers
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
          return event;
        },
      });
      SentryBrowser = Sentry;
      console.info('[Sentry] Initialized successfully');
    }).catch(() => {
      // @sentry/nextjs not installed — gracefully degrade
      console.info('[Sentry] SDK not installed — error reporting disabled');
    });
  } catch {
    // Sentry unavailable
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (SentryBrowser) {
    SentryBrowser.captureException(error, { extra: context });
  }
  console.error('[Error]', error.message, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (SentryBrowser) {
    SentryBrowser.captureMessage(message, level);
  }
}

export default { initSentry, captureException, captureMessage };
