import { RequestHandler } from 'express';
import Stripe from 'stripe';
import PlatformPlan from '../models/platformPlan.model';
import TenantSubscription from '../models/tenantSubscription.model';
import Commission from '../models/commission.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// ── Stripe lazy-init (same pattern as payment.controller) ────────────────────
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new CustomError('Payment service is not configured', 503);
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any,
    });
  }
  return _stripe;
}

// ══════════════════════════════════════════════════════════════════════════════
// PLATFORM PLAN CRUD (SuperAdmin only)
// ══════════════════════════════════════════════════════════════════════════════

/** GET /api/billing/plans — list all active plans (public) */
export const getPlans: RequestHandler = async (_req, res, next) => {
  try {
    const plans = await PlatformPlan.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
};

/** GET /api/billing/plans/all — list ALL plans inc. inactive (superadmin) */
export const getAllPlans: RequestHandler = async (_req, res, next) => {
  try {
    const plans = await PlatformPlan.find().sort({ sortOrder: 1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
};

/** POST /api/billing/plans — create a plan (superadmin) */
export const createPlan: RequestHandler = async (req, res, next) => {
  try {
    const plan = await PlatformPlan.create(req.body);
    logger.info(`Platform plan created: ${plan.name} (${plan.slug})`);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/billing/plans/:id — update plan (superadmin) */
export const updatePlan: RequestHandler = async (req, res, next) => {
  try {
    const plan = await PlatformPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return next(new CustomError('Plan not found', 404));
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/billing/plans/:id — soft delete plan (superadmin) */
export const deletePlan: RequestHandler = async (req, res, next) => {
  try {
    const plan = await PlatformPlan.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!plan) return next(new CustomError('Plan not found', 404));
    res.json({ success: true, message: 'Plan deactivated' });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// TENANT SUBSCRIPTION MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

/** POST /api/billing/subscribe — tenant subscribes to a plan */
export const subscribe: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    const tenant = authReq.tenant || 'default';

    const plan = await PlatformPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return next(new CustomError('Plan not found or inactive', 404));
    }

    // Check if tenant already has a subscription
    let sub = await TenantSubscription.findOne({ tenant });

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    if (sub) {
      // Upgrade/downgrade existing subscription
      sub.plan = plan._id as any;
      sub.billingCycle = billingCycle;
      sub.currentPeriodStart = now;
      sub.currentPeriodEnd = periodEnd;
      sub.status = 'active';
      sub.cancelAtPeriodEnd = false;
      await sub.save();
      logger.info(`Tenant ${tenant} changed plan to ${plan.slug}`);
    } else {
      // New subscription with 14-day trial
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);

      sub = await TenantSubscription.create({
        tenant,
        plan: plan._id,
        billingCycle,
        status: 'trialing',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEnd,
      });
      logger.info(`Tenant ${tenant} subscribed to ${plan.slug} (trial until ${trialEnd.toISOString()})`);
    }

    // Try to create Stripe Checkout Session for payment
    let checkoutUrl: string | null = null;
    try {
      const stripe = getStripe();
      const priceId =
        billingCycle === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

      if (priceId) {
        // Create or retrieve Stripe customer
        let customerId = sub.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            metadata: { tenant, planSlug: plan.slug },
          });
          customerId = customer.id;
          sub.stripeCustomerId = customerId;
          await sub.save();
        }

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/billing?success=1`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/billing?cancelled=1`,
          metadata: { tenant, planId: plan._id.toString() },
        });
        checkoutUrl = session.url;
      }
    } catch (stripeErr) {
      // Stripe not configured or price IDs missing — continue without payment
      logger.warn('Stripe checkout session skipped:', stripeErr);
    }

    res.status(201).json({
      success: true,
      data: sub,
      checkoutUrl,
      message: checkoutUrl
        ? 'Redirect to Stripe to complete payment'
        : `Subscribed to ${plan.name} plan (payment configuration pending)`,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/billing/subscription — get current tenant's subscription */
export const getSubscription: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant || 'default';
    const sub = await TenantSubscription.findOne({ tenant }).populate('plan');
    if (!sub) {
      res.json({ success: true, data: null, message: 'No subscription found' });
      return;
    }
    res.json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
};

/** POST /api/billing/cancel — cancel subscription at period end */
export const cancelSubscription: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant || 'default';
    const sub = await TenantSubscription.findOne({ tenant });
    if (!sub) return next(new CustomError('No subscription found', 404));

    sub.cancelAtPeriodEnd = true;
    await sub.save();

    // Cancel in Stripe if applicable
    if (sub.stripeSubscriptionId) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (e) {
        logger.warn('Stripe subscription cancel failed:', e);
      }
    }

    logger.info(`Tenant ${tenant} scheduled cancellation at period end`);
    res.json({ success: true, message: 'Subscription will cancel at end of billing period' });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// COMMISSION TRACKING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Record commission on an order. Called internally from order.controller
 * after a successful payment.
 */
export const recordCommission = async (
  orderId: string,
  tenant: string,
  orderTotal: number,
  currency: string
) => {
  try {
    const sub = await TenantSubscription.findOne({ tenant }).populate('plan');
    if (!sub) return null;

    const plan = sub.plan as any;
    const rate = plan?.commissionRate ?? 5.0;
    const amount = parseFloat(((orderTotal * rate) / 100).toFixed(2));

    const commission = await Commission.create({
      order: orderId,
      tenant,
      orderTotal,
      commissionRate: rate,
      commissionAmount: amount,
      currency,
    });

    // Update cumulative totals
    sub.totalRevenue += orderTotal;
    sub.totalCommission += amount;
    await sub.save();

    logger.info(
      `Commission recorded: ${currency} ${amount} (${rate}%) on order ${orderId} for tenant ${tenant}`
    );
    return commission;
  } catch (err) {
    logger.error('Failed to record commission:', err);
    return null;
  }
};

/** GET /api/billing/commissions — list commission records (admin) */
export const getCommissions: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant || 'default';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const query = authReq.user?.role === 'superadmin' ? {} : { tenant };

    const [commissions, total] = await Promise.all([
      Commission.find(query)
        .populate('order', 'orderNumber total status')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Commission.countDocuments(query),
    ]);

    res.json({ success: true, data: commissions, total, page, limit });
  } catch (err) {
    next(err);
  }
};

/** GET /api/billing/revenue — revenue dashboard (superadmin) */
export const getRevenueDashboard: RequestHandler = async (_req, res, next) => {
  try {
    const [totalCommissions, subscriptionStats, topTenants] = await Promise.all([
      // Total commissions by status
      Commission.aggregate([
        {
          $group: {
            _id: '$status',
            total: { $sum: '$commissionAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Subscription stats
      TenantSubscription.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalRevenue' },
            totalCommission: { $sum: '$totalCommission' },
          },
        },
      ]),
      // Top 10 tenants by revenue
      TenantSubscription.find()
        .populate('plan', 'name slug commissionRate')
        .sort({ totalRevenue: -1 })
        .limit(10)
        .select('tenant totalRevenue totalCommission status plan'),
    ]);

    // Monthly revenue for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Commission.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          commission: { $sum: '$commissionAmount' },
          gmv: { $sum: '$orderTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        commissions: totalCommissions,
        subscriptions: subscriptionStats,
        topTenants,
        monthlyRevenue,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// SEED DEFAULT PLANS
// ══════════════════════════════════════════════════════════════════════════════

/** Seed default platform plans if none exist */
export const seedDefaultPlans = async () => {
  const count = await PlatformPlan.countDocuments();
  if (count > 0) return;

  const plans = [
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small businesses just getting started',
      price: { monthly: 29, yearly: 290, currency: 'GBP' },
      limits: { admins: 1, products: 50, orders: -1, storage: 500, apiCalls: 1000 },
      features: ['products', 'cart', 'checkout', 'delivery', 'email_support'],
      commissionRate: 5.0,
      sortOrder: 1,
    },
    {
      name: 'Growth',
      slug: 'growth',
      description: 'For growing businesses with expanding needs',
      price: { monthly: 79, yearly: 790, currency: 'GBP' },
      limits: { admins: 3, products: 500, orders: -1, storage: 2000, apiCalls: 10000 },
      features: [
        'products', 'cart', 'checkout', 'delivery', 'pickup',
        'reviews', 'wishlist', 'coupons', 'analytics',
        'priority_support',
      ],
      commissionRate: 3.5,
      sortOrder: 2,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'Full-featured plan for serious businesses',
      price: { monthly: 199, yearly: 1990, currency: 'GBP' },
      limits: { admins: -1, products: -1, orders: -1, storage: 10000, apiCalls: 50000 },
      features: [
        'products', 'cart', 'checkout', 'delivery', 'pickup',
        'reviews', 'wishlist', 'chat', 'coupons', 'analytics',
        'white_label', 'custom_domain', 'api_access',
        'dedicated_support',
      ],
      commissionRate: 2.0,
      sortOrder: 3,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Custom solutions for large organisations',
      price: { monthly: 499, yearly: 4990, currency: 'GBP' },
      limits: { admins: -1, products: -1, orders: -1, storage: -1, apiCalls: -1 },
      features: [
        'products', 'cart', 'checkout', 'delivery', 'pickup',
        'reviews', 'wishlist', 'chat', 'coupons', 'analytics',
        'white_label', 'custom_domain', 'api_access',
        'multi_location', 'sla', 'account_manager',
        'custom_integrations',
      ],
      commissionRate: 1.0,
      sortOrder: 4,
    },
  ];

  await PlatformPlan.insertMany(plans);
  logger.info('Default platform plans seeded (Starter, Growth, Pro, Enterprise)');
};
