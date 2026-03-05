import { RequestHandler } from 'express';
import Partner from '../models/partner.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/** POST /api/partners/apply — apply to become a partner/affiliate */
export const apply: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!._id;
    const existing = await Partner.findOne({ user: userId });
    if (existing) {
      return next(new CustomError('You already have a partner application', 409));
    }

    const code = req.body.code?.toUpperCase() || crypto.randomBytes(4).toString('hex').toUpperCase();

    const partner = await Partner.create({
      user: userId,
      code,
      name: req.body.name || `${authReq.user!.firstName} ${authReq.user!.lastName}`,
      email: req.body.email || authReq.user!.email,
      type: req.body.type || 'affiliate',
      payoutMethod: req.body.payoutMethod || 'bank_transfer',
      payoutDetails: req.body.payoutDetails,
    });

    logger.info(`Partner application created: ${partner.code} by ${authReq.user!.email}`);
    res.status(201).json({ success: true, data: partner });
  } catch (err) {
    next(err);
  }
};

/** GET /api/partners/me — get current user's partner profile */
export const getMyProfile: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const partner = await Partner.findOne({ user: authReq.user!._id });
    if (!partner) {
      res.json({ success: true, data: null });
      return;
    }
    res.json({ success: true, data: partner });
  } catch (err) {
    next(err);
  }
};

/** GET /api/partners — list all partners (superadmin) */
export const listPartners: RequestHandler = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const query: any = {};
    if (status) query.status = status;

    const [partners, total] = await Promise.all([
      Partner.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Partner.countDocuments(query),
    ]);

    res.json({ success: true, data: partners, total, page, limit });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/partners/:id/status — approve/suspend partner (superadmin) */
export const updatePartnerStatus: RequestHandler = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'pending'].includes(status)) {
      return next(new CustomError('Invalid status', 400));
    }

    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!partner) return next(new CustomError('Partner not found', 404));

    logger.info(`Partner ${partner.code} status → ${status}`);
    res.json({ success: true, data: partner });
  } catch (err) {
    next(err);
  }
};

/** POST /api/partners/track-referral — track a referral sign-up (internal) */
export const trackReferral = async (partnerCode: string, tenantId: string) => {
  try {
    const partner = await Partner.findOne({ code: partnerCode.toUpperCase(), status: 'active' });
    if (!partner) return null;

    partner.stats.referrals += 1;
    partner.referredTenants.push({
      tenant: tenantId,
      signedUpAt: new Date(),
      totalRevenue: 0,
      commissionEarned: 0,
    });
    await partner.save();

    logger.info(`Referral tracked: partner ${partner.code} → tenant ${tenantId}`);
    return partner;
  } catch (err) {
    logger.error('Failed to track referral:', err);
    return null;
  }
};

/**
 * Record partner commission when a referred tenant makes a subscription payment.
 * Called internally after subscription payments.
 */
export const recordPartnerCommission = async (tenantId: string, paymentAmount: number) => {
  try {
    // Find partner who referred this tenant
    const partner = await Partner.findOne({
      status: 'active',
      'referredTenants.tenant': tenantId,
    });
    if (!partner) return;

    const earned = parseFloat(((paymentAmount * partner.commissionRate) / 100).toFixed(2));

    // Update referred tenant entry
    const entry = partner.referredTenants.find((r: any) => r.tenant === tenantId);
    if (entry) {
      entry.totalRevenue += paymentAmount;
      entry.commissionEarned += earned;
      if (!entry.firstPaymentAt) entry.firstPaymentAt = new Date();
    }

    partner.stats.totalEarned += earned;
    partner.stats.pendingPayout += earned;
    await partner.save();

    logger.info(
      `Partner ${partner.code} earned £${earned} from tenant ${tenantId} payment of £${paymentAmount}`
    );
  } catch (err) {
    logger.error('Failed to record partner commission:', err);
  }
};

/** POST /api/partners/:id/payout — record a payout to partner (superadmin) */
export const recordPayout: RequestHandler = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const partner = await Partner.findById(req.params.id);
    if (!partner) return next(new CustomError('Partner not found', 404));

    if (amount > partner.stats.pendingPayout) {
      return next(new CustomError('Payout exceeds pending balance', 400));
    }

    partner.stats.totalPaid += amount;
    partner.stats.pendingPayout -= amount;
    await partner.save();

    logger.info(`Payout of £${amount} recorded for partner ${partner.code}`);
    res.json({ success: true, data: partner, message: `£${amount} payout recorded` });
  } catch (err) {
    next(err);
  }
};

/** GET /api/partners/validate/:code — validate referral code (public) */
export const validateCode: RequestHandler = async (req, res, next) => {
  try {
    const partner = await Partner.findOne({
      code: req.params.code.toUpperCase(),
      status: 'active',
    }).select('code name type');

    if (!partner) {
      res.json({ success: false, message: 'Invalid referral code' });
      return;
    }

    res.json({ success: true, data: { code: partner.code, name: partner.name } });
  } catch (err) {
    next(err);
  }
};
