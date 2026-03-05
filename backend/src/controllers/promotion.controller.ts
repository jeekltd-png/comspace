import { RequestHandler } from 'express';
import PromotedListing from '../models/promotedListing.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

/** POST /api/promotions — create a promoted listing (merchant) */
export const createPromotion: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const promotion = await PromotedListing.create({
      ...req.body,
      tenant: authReq.tenant || 'default',
      merchant: authReq.user!._id,
      status: 'pending',
    });
    logger.info(`Promoted listing created: ${promotion._id} by ${authReq.user!._id}`);
    res.status(201).json({ success: true, data: promotion });
  } catch (err) {
    next(err);
  }
};

/** GET /api/promotions — list promotions for current tenant */
export const getPromotions: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant || 'default';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    let query: any = { tenant };
    // Merchants only see their own; admins see all
    if (authReq.user?.role === 'merchant') {
      query.merchant = authReq.user._id;
    }

    const [promotions, total] = await Promise.all([
      PromotedListing.find(query)
        .populate('product', 'name images price')
        .populate('merchant', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PromotedListing.countDocuments(query),
    ]);

    res.json({ success: true, data: promotions, total, page, limit });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/promotions/:id/status — approve/pause/resume (admin) */
export const updatePromotionStatus: RequestHandler = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'expired'].includes(status)) {
      return next(new CustomError('Invalid status', 400));
    }
    const promo = await PromotedListing.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!promo) return next(new CustomError('Promotion not found', 404));
    res.json({ success: true, data: promo });
  } catch (err) {
    next(err);
  }
};

/** POST /api/promotions/:id/click — record a click (public, called from frontend) */
export const recordClick: RequestHandler = async (req, res, next) => {
  try {
    const promo = await PromotedListing.findById(req.params.id);
    if (!promo || promo.status !== 'active') {
      res.json({ success: true }); // silently ignore
      return;
    }

    promo.performance.clicks += 1;
    // Check budget
    if (promo.pricing.model === 'cpc') {
      promo.budget.spent += promo.pricing.amount;
      if (promo.budget.spent >= promo.budget.total) {
        promo.status = 'expired';
        logger.info(`Promotion ${promo._id} budget exhausted`);
      }
    }
    await promo.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/** POST /api/promotions/:id/impression — record impressions (batch) */
export const recordImpression: RequestHandler = async (req, res, next) => {
  try {
    const count = parseInt(req.body.count as string) || 1;
    await PromotedListing.findByIdAndUpdate(req.params.id, {
      $inc: { 'performance.impressions': count },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/** GET /api/promotions/active — get active promotions for storefront display (public) */
export const getActivePromotions: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant || (req.query.tenant as string) || 'default';
    const now = new Date();

    const promotions = await PromotedListing.find({
      tenant,
      status: 'active',
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    })
      .populate('product', 'name images price currency slug')
      .sort({ 'pricing.amount': -1 }) // highest bidders first
      .limit(10);

    res.json({ success: true, data: promotions });
  } catch (err) {
    next(err);
  }
};

/** GET /api/promotions/stats — promotion performance dashboard (admin) */
export const getPromotionStats: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant || 'default';
    const query = authReq.user?.role === 'superadmin' ? {} : { tenant };

    const stats = await PromotedListing.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSpent: { $sum: '$budget.spent' },
          totalClicks: { $sum: '$performance.clicks' },
          totalImpressions: { $sum: '$performance.impressions' },
          totalConversions: { $sum: '$performance.conversions' },
        },
      },
    ]);

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
