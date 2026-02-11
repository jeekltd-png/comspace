import rateLimit from 'express-rate-limit';

// Global rate limiter — applies to all routes
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for authentication endpoints (login/register/forgot-password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
});

// Checkout / order creation — prevent abuse
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many order attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset — very strict
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset requests. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload — moderate
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many file uploads. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Review creation — prevent review bombing
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many review submissions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Newsletter subscription — prevent spam
export const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many subscription attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
