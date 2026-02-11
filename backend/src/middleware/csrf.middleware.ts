import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * CSRF protection using the double-submit cookie pattern.
 *
 * How it works:
 * 1. Server sets a random token in a cookie (csrf-token) on GET /api/auth/csrf-token
 * 2. Client reads the cookie and sends it in the X-CSRF-Token header on mutating requests
 * 3. Middleware compares cookie value with header value
 *
 * Safe for SPAs because:
 * - Cookie is SameSite=Strict, so cross-origin forms can't send it
 * - Even if they could, they can't read it (HttpOnly=false so JS on same origin CAN read it)
 * - An attacker on a different origin can't read the cookie to put it in the header
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Middleware to enforce CSRF on mutating requests.
 * Skip in test environment and for webhook routes (which use raw body).
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip in test env
  if (process.env.NODE_ENV === 'test') return next();

  // Skip safe (read-only) methods
  if (SAFE_METHODS.has(req.method)) return next();

  // Skip webhook routes (Stripe sends its own signature)
  if (req.path.includes('/webhook')) return next();

  // Skip auth routes (login, register, forgot-password) — no session exists yet,
  // and they're already rate-limited. CSRF is for protecting authenticated sessions.
  // Note: when mounted at app.use('/api', csrfProtection), req.path strips the mount prefix.
  if (req.path.startsWith('/auth/') || req.originalUrl.startsWith('/api/auth/')) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ message: 'Invalid or missing CSRF token' });
    return;
  }

  next();
};

/**
 * Route handler that sets the CSRF cookie and returns the token.
 * Call GET /api/auth/csrf-token on app load.
 */
export const setCsrfToken = (_req: Request, res: Response): void => {
  const token = crypto.randomBytes(32).toString('hex');

  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // JS must read it to put in header
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  });

  res.json({ csrfToken: token });
};
