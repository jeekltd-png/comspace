import { RequestHandler } from 'express';
import ApiUsage from '../models/apiUsage.model';
import TenantSubscription from '../models/tenantSubscription.model';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Middleware: track API usage per tenant per day.
 * Lightweight — uses updateOne with $inc for fire-and-forget performance.
 */
export const trackApiUsage: RequestHandler = (req, _res, next) => {
  const authReq = req as AuthRequest;
  const tenant = authReq.tenant || 'default';
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const endpoint = req.baseUrl + req.path;

  // Fire-and-forget: don't await, don't block the request
  ApiUsage.updateOne(
    { tenant, date },
    {
      $inc: { calls: 1, [`endpoints.${endpoint.replace(/\./g, '_')}`]: 1 },
      $setOnInsert: { tenant, date },
    },
    { upsert: true }
  ).catch(() => {}); // silently ignore tracking failures

  next();
};

/**
 * Middleware: enforce API rate limits based on tenant's plan tier.
 * Checks daily call count against plan limits.
 */
export const enforceApiLimits: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  const tenant = authReq.tenant || 'default';
  const date = new Date().toISOString().slice(0, 10);

  try {
    // Check tenant's plan limit
    const sub = await TenantSubscription.findOne({ tenant }).populate('plan');
    if (!sub || !sub.plan) return next(); // no subscription = no limit enforcement

    const plan = sub.plan as any;
    const dailyLimit = plan.limits?.apiCalls ?? -1;
    if (dailyLimit === -1) return next(); // unlimited

    // Get today's usage
    const usage = await ApiUsage.findOne({ tenant, date });
    const currentCalls = usage?.calls || 0;

    if (currentCalls >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: `API rate limit exceeded. Your ${plan.name} plan allows ${dailyLimit} calls/day. Upgrade for higher limits.`,
        upgradeUrl: '/pricing',
      });
    }

    next();
  } catch (err) {
    // Don't block requests if limit check fails
    next();
  }
};

/** GET /api/billing/api-usage — view API usage (admin) */
export const getApiUsage: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant || 'default';
    const days = parseInt(req.query.days as string) || 30;

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);

    const query =
      authReq.user?.role === 'superadmin'
        ? { date: { $gte: sinceStr } }
        : { tenant, date: { $gte: sinceStr } };

    const usage = await ApiUsage.find(query).sort({ date: -1 });

    // Aggregate totals
    const totalCalls = usage.reduce((sum, u) => sum + u.calls, 0);
    const dailyAvg = days > 0 ? Math.round(totalCalls / days) : 0;

    res.json({
      success: true,
      data: {
        usage,
        summary: { totalCalls, dailyAvg, days },
      },
    });
  } catch (err) {
    next(err);
  }
};
