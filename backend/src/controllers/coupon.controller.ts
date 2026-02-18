import { RequestHandler } from 'express';
import Coupon from '../models/coupon.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

/**
 * List all coupons (admin)
 */
export const listCoupons: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20, active } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { tenant: authReq.tenant };
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      Coupon.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: { coupons, pagination: { page: Number(page), limit: Number(limit), total } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a coupon (admin)
 */
export const createCoupon: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const {
      code, description, discountType, discountValue,
      minOrderAmount, maxDiscount, usageLimit, startDate, endDate,
      applicableProducts,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !startDate || !endDate) {
      return next(new CustomError('code, discountType, discountValue, startDate, endDate are required', 400));
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return next(new CustomError('endDate must be after startDate', 400));
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount,
      usageLimit: usageLimit || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      applicableProducts: applicableProducts || [],
      tenant: authReq.tenant,
    });

    logger.info('Coupon created', { couponId: coupon._id, code: coupon.code, tenant: authReq.tenant });

    res.status(201).json({ success: true, data: { coupon } });
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new CustomError('A coupon with this code already exists', 409));
    }
    next(error);
  }
};

/**
 * Update a coupon (admin)
 */
export const updateCoupon: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent changing the tenant
    delete updates.tenant;
    delete updates.usedCount;

    if (updates.code) updates.code = updates.code.toUpperCase().trim();
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const coupon = await Coupon.findOneAndUpdate(
      { _id: id, tenant: authReq.tenant },
      updates,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return next(new CustomError('Coupon not found', 404));
    }

    res.status(200).json({ success: true, data: { coupon } });
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new CustomError('A coupon with this code already exists', 409));
    }
    next(error);
  }
};

/**
 * Delete a coupon (admin)
 */
export const deleteCoupon: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const coupon = await Coupon.findOneAndDelete({ _id: id, tenant: authReq.tenant });
    if (!coupon) {
      return next(new CustomError('Coupon not found', 404));
    }
    res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate & apply a coupon (customer-facing)
 */
export const validateCoupon: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { code, orderTotal } = req.body;
    if (!code) return next(new CustomError('Coupon code is required', 400));

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      tenant: authReq.tenant,
      isActive: true,
    });

    if (!coupon) {
      return next(new CustomError('Invalid coupon code', 404));
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return next(new CustomError('This coupon has expired', 400));
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return next(new CustomError('This coupon has reached its usage limit', 400));
    }

    if (orderTotal !== undefined && orderTotal < coupon.minOrderAmount) {
      return next(new CustomError(`Minimum order amount is $${coupon.minOrderAmount}`, 400));
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = ((orderTotal || 0) * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discount: Math.round(discount * 100) / 100,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
