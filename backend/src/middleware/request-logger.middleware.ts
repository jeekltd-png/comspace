import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Structured request/response logging middleware.
 * Logs method, path, status code, response time, content-length, and request ID.
 * Replaces the default morgan output with JSON-structured logs.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();

  // Attach a listener for when the response finishes
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000; // ms
    const requestId = (req as any).requestId || req.headers['x-request-id'] || '-';

    const logData = {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.get('content-length') || '0',
      userAgent: req.get('user-agent') || '-',
      ip: req.ip || req.socket.remoteAddress || '-',
      userId: (req as any).user?._id?.toString() || '-',
    };

    // Log 5xx as error, 4xx as warn, rest as info
    if (res.statusCode >= 500) {
      logger.error('Request completed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};
