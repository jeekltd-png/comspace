/**
 * Salon Service Controller
 *
 * CRUD for salon services + public browse/search.
 */
import { RequestHandler } from 'express';
import SalonService from '../models/salon-service.model';
import StaffMember from '../models/staff-member.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// ── Helpers ──────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Public ───────────────────────────────────────────────────

/** GET /api/salon/services — list active services for a tenant */
export const getServices: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { category, featured, search, page = 1, limit = 20 } = req.query;
    const limitNum = Math.min(Number(limit) || 20, 50);

    const filter: any = { tenant: authReq.tenant, isActive: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * limitNum;

    const [services, total] = await Promise.all([
      SalonService.find(filter)
        .sort('sortOrder name')
        .skip(skip)
        .limit(limitNum)
        .populate('staffIds', 'name avatar title')
        .lean(),
      SalonService.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        services,
        pagination: { page: Number(page), limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/salon/services/categories — distinct categories */
export const getCategories: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const categories = await SalonService.distinct('category', {
      tenant: authReq.tenant,
      isActive: true,
    });
    res.status(200).json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/salon/services/:slug — single service detail */
export const getServiceBySlug: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const service = await SalonService.findOne({
      slug: req.params.slug,
      tenant: authReq.tenant,
      isActive: true,
    })
      .populate('staffIds', 'name avatar title slug')
      .lean();

    if (!service) return next(new CustomError('Service not found', 404));
    res.status(200).json({ success: true, data: { service } });
  } catch (err) {
    next(err);
  }
};

// ── Merchant CRUD ────────────────────────────────────────────

/** POST /api/salon/services — create a new service (merchant) */
export const createService: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { name, description, category, duration, price, currency, salePrice, image, images, tags, isFeatured, sortOrder } = req.body;

    if (!name || !category || !duration || price == null) {
      return next(new CustomError('name, category, duration, and price are required', 400));
    }

    const slug = slugify(name) + '-' + Date.now().toString(36);

    const service = await SalonService.create({
      name,
      slug,
      description,
      category,
      duration,
      price,
      currency: currency || 'GBP',
      salePrice,
      image,
      images,
      tags,
      isFeatured: isFeatured || false,
      sortOrder: sortOrder || 0,
      tenant: authReq.tenant,
      vendor: authReq.user!._id,
    });

    logger.info(`Salon service created: ${service.name} [${service._id}]`);

    res.status(201).json({ success: true, data: { service } });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/salon/services/:id — update a service (merchant) */
export const updateService: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const service = await SalonService.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant, vendor: authReq.user!._id },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!service) return next(new CustomError('Service not found or unauthorized', 404));

    res.status(200).json({ success: true, data: { service } });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/salon/services/:id — soft-delete (merchant) */
export const deleteService: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const service = await SalonService.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant, vendor: authReq.user!._id },
      { isActive: false },
      { new: true },
    );

    if (!service) return next(new CustomError('Service not found or unauthorized', 404));

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};

// ── Staff management on service ──────────────────────────────

/** PUT /api/salon/services/:id/staff — assign staff to a service */
export const assignStaff: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { staffIds } = req.body;
    if (!Array.isArray(staffIds)) return next(new CustomError('staffIds must be an array', 400));

    const service = await SalonService.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant, vendor: authReq.user!._id },
      { staffIds },
      { new: true },
    ).populate('staffIds', 'name avatar title');

    if (!service) return next(new CustomError('Service not found', 404));

    // Mirror assignment on the staff models
    await StaffMember.updateMany(
      { _id: { $in: staffIds }, tenant: authReq.tenant },
      { $addToSet: { serviceIds: service._id } },
    );

    res.status(200).json({ success: true, data: { service } });
  } catch (err) {
    next(err);
  }
};
