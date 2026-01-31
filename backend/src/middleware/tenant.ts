import { Request, Response, NextFunction } from 'express';

export const tenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Extract tenant from subdomain or header
  const host = req.get('host') || '';
  const subdomain = host.split('.')[0];
  
  // Set tenant in request
  req.tenant = subdomain;
  
  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenant?: string;
    }
  }
}
