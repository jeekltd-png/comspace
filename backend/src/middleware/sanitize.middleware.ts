import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitize string values in an object to prevent XSS.
 * Strips common attack vectors: <script>, onerror, javascript:, data: URIs.
 * Normalizes encoded characters first to prevent bypass via encoding tricks.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    let s = value;

    // Decode common HTML entities and URL encoding to catch bypass attempts
    // (e.g., &#x6A;avascript:, %3Cscript%3E)
    s = s.replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    s = s.replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
    s = s.replace(/%([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    // Remove null bytes (used to bypass WAFs)
    s = s.replace(/\0/g, '');

    return s
      // Remove <script> tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers (onclick, onerror, onload, etc.)
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\bon\w+\s*=/gi, '')
      // Remove javascript: and data: URIs (case-insensitive, whitespace-tolerant)
      .replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '')
      .replace(/data\s*:\s*(?!image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,)/gi, '')
      // Remove <iframe>, <object>, <embed>, <form>, <input>, <textarea>, <button>, <svg>, <math> tags
      .replace(/<\s*\/?\s*(iframe|object|embed|form|input|textarea|button|svg|math|base|link|meta)\b[^>]*>/gi, '')
      // Remove style expressions (IE)
      .replace(/expression\s*\(/gi, '')
      // Remove vbscript: URIs
      .replace(/vbscript\s*:/gi, '')
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
 * Express middleware that sanitizes req.body and req.query
 * to prevent stored / reflected XSS attacks.
 */
export const sanitizeInputs = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }
  // Note: req.params are route segments defined by the framework and don't need XSS sanitization
  next();
};
