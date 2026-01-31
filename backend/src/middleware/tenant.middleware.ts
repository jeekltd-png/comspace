import { RequestHandler } from 'express';
import WhiteLabel from '../models/white-label.model';
import { redisClient } from '../server';
import { AuthRequest } from './auth.middleware';

export const tenantMiddleware: RequestHandler = async (req, _res, next) => {
  try {
    const authReq = req as AuthRequest;
    let tenantId = 'default';

    // Try to get tenant from subdomain or custom domain
    const host = req.get('host');
    if (host) {
      // Check if it's a custom domain
      const cachedTenant = await redisClient.get(`tenant:domain:${host}`);

      if (cachedTenant) {
        tenantId = cachedTenant;
      } else {
        const whiteLabel = await WhiteLabel.findOne({ domain: host, isActive: true });
        if (whiteLabel) {
          tenantId = whiteLabel.tenantId;
          // Cache for 1 hour
          await redisClient.setEx(`tenant:domain:${host}`, 3600, tenantId);
        }
      }
    }

    // Also check header (useful for mobile apps)
    const headerTenant = req.get('X-Tenant-ID');
    if (headerTenant) {
      tenantId = headerTenant;
    }

    authReq.tenant = tenantId;
    next();
  } catch (error) {
    const authReq = req as AuthRequest;
    authReq.tenant = 'default';
    next();
  }
};
