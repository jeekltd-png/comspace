import { RequestHandler } from 'express';
import WhiteLabel from '../models/white-label.model';
import { AuthRequest } from './auth.middleware';
import { CustomError } from './error.middleware';
import { redisClient } from '../server';

/**
 * Feature-gate middleware factory.
 *
 * Checks whether a tenant has the specified feature(s) enabled in their
 * white-label configuration. If any required feature is disabled, the
 * request is rejected with a 403 status.
 *
 * Usage:
 *   router.use(requireFeature('cart'));
 *   router.post('/checkout', requireFeature('cart', 'checkout'), handler);
 */
export function requireFeature(
  ...features: string[]
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.tenant || 'default';

      // Try cached features first (60s TTL)
      const cacheKey = `tenant:features:${tenantId}`;
      let featureMap: Record<string, boolean> | null = null;

      try {
        const cached = await redisClient?.get(cacheKey);
        if (cached) {
          featureMap = JSON.parse(cached);
        }
      } catch (_) {
        // Redis unavailable — fall through to DB
      }

      if (!featureMap) {
        const config = await WhiteLabel.findOne(
          { tenantId, isActive: true },
          { features: 1 }
        ).lean();

        featureMap = (config?.features as Record<string, boolean>) || {};

        // Cache for 60 seconds
        try {
          await redisClient?.setEx(cacheKey, 60, JSON.stringify(featureMap));
        } catch (_) {
          // ignore cache write failure
        }
      }

      // Check every requested feature
      for (const feat of features) {
        if (featureMap[feat] === false) {
          return next(
            new CustomError(
              `The "${feat}" feature is not enabled for this store. Contact the store admin to enable it.`,
              403
            )
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
