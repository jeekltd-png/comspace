import { Request, Response, NextFunction } from 'express';

export const languageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get language from various sources
  const langFromQuery = req.query.lang as string;
  const langFromHeader = req.headers['accept-language'];
  const langFromCookie = req.cookies?.i18next;

  // Priority: query > cookie > header
  const language = langFromQuery || langFromCookie || langFromHeader?.split(',')[0] || 'en';

  // Normalize language code (e.g., 'en-US' -> 'en')
  const normalizedLang = language.split('-')[0].toLowerCase();

  // Set language in request
  req.language = normalizedLang;

  // Set cookie for persistence
  if (langFromQuery) {
    res.cookie('i18next', normalizedLang, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      language: string;
    }
  }
}
