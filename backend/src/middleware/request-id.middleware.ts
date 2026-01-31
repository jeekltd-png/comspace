import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setSentryTag, getSentryClient } from '../utils/sentry';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incoming = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-Id', incoming);
  (req as any).requestId = incoming;

  // Attach to Sentry if available
  try {
    const Sentry = getSentryClient();
    if (Sentry) {
      setSentryTag('request_id', incoming);
      Sentry.setContext('request', {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
      });
    }
  } catch (e) {
    // ignore
  }

  next();
};