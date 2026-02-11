import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitize string values in an object to prevent XSS.
 * Strips common attack vectors: <script>, onerror, javascript:, data: URIs.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      // Remove <script> tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers (onclick, onerror, onload, etc.)
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: and data: URIs
      .replace(/javascript\s*:/gi, '')
      .replace(/data\s*:\s*(?!image\/(?:png|jpe?g|gif|webp|svg\+xml))/gi, '')
      // Remove <iframe>, <object>, <embed> tags
      .replace(/<\s*\/?\s*(iframe|object|embed|form|input|textarea|button)\b[^>]*>/gi, '')
      // Remove style expressions (IE)
      .replace(/expression\s*\(/gi, '')
      // Trim result
      .trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      cleaned[k] = sanitizeValue(v);
    }
    return cleaned;
  }

  return value;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to prevent stored / reflected XSS attacks.
 */
export const sanitizeInputs = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }
  next();
};
