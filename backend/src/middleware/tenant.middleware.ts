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
      let cachedTenant: string | null = null;
      try {
        cachedTenant = await redisClient?.get(`tenant:domain:${host}`);
      } catch (_) { /* redis may be unavailable */ }

      if (cachedTenant) {
        tenantId = cachedTenant;
      } else {
        const whiteLabel = await WhiteLabel.findOne({ domain: host, isActive: true });
        if (whiteLabel) {
          tenantId = whiteLabel.tenantId;
          // Cache for 1 hour
          try {
            await redisClient?.setEx(`tenant:domain:${host}`, 3600, tenantId);
          } catch (_) { /* ignore cache write failure */ }
        }
      }
    }

    // Also check header (useful for mobile apps) — validate against DB
    const headerTenant = req.get('X-Tenant-ID');
    if (headerTenant && headerTenant !== 'default') {
      // Only allow known tenant IDs — check cache first, then DB
      let valid = false;
      try {
        const cachedValid = await redisClient?.get(`tenant:valid:${headerTenant}`);
        if (cachedValid === '1') {
          valid = true;
        }
      } catch (_) { /* ignore */ }

      if (!valid) {
        const exists = await WhiteLabel.findOne({ tenantId: headerTenant, isActive: true });
        if (exists) {
          valid = true;
          try {
            await redisClient?.setEx(`tenant:valid:${headerTenant}`, 3600, '1');
          } catch (_) { /* ignore */ }
        }
      }

      if (valid) {
        tenantId = headerTenant;
      }
      // If not valid, ignore the header and keep the domain-resolved or default tenant
    }

    authReq.tenant = tenantId;
    next();
  } catch (error) {
    const authReq = req as AuthRequest;
    authReq.tenant = 'default';
    next();
  }
};
