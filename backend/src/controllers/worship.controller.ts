/**
 * Worship Controller
 *
 * CRUD for worship / church providers + public browse / search / discovery.
 */
import { RequestHandler } from 'express';
import WorshipProvider from '../models/worship-provider.model';
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

/** GET /api/worship/providers — list active places of worship for a tenant */
export const getProviders: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { subType, faithTradition, search, page = 1, limit = 20 } = req.query;
    const limitNum = Math.min(Number(limit) || 20, 50);

    const filter: any = { tenant: authReq.tenant, isActive: true };
    if (subType) filter.subType = subType;
    if (faithTradition) filter.faithTradition = faithTradition;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { denomination: { $regex: search, $options: 'i' } },
        { ministries: { $regex: search, $options: 'i' } },
        { serviceTags: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * limitNum;

    const [providers, total] = await Promise.all([
      WorshipProvider.find(filter)
        .sort('-rating name')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WorshipProvider.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        providers,
        pagination: { page: Number(page), limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/worship/providers/faith-traditions — distinct faith traditions */
export const getFaithTraditions: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const traditions = await WorshipProvider.distinct('faithTradition', {
      tenant: authReq.tenant,
      isActive: true,
    });
    res.status(200).json({ success: true, data: { traditions } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/worship/providers/sub-types — distinct sub-types */
export const getSubTypes: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const subTypes = await WorshipProvider.distinct('subType', {
      tenant: authReq.tenant,
      isActive: true,
    });
    res.status(200).json({ success: true, data: { subTypes } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/worship/providers/:slug — single provider detail */
export const getProviderBySlug: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const provider = await WorshipProvider.findOne({
      slug: req.params.slug,
      tenant: authReq.tenant,
      isActive: true,
    }).lean();

    if (!provider) return next(new CustomError('Place of worship not found', 404));
    res.status(200).json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

// ── Merchant / Admin CRUD ────────────────────────────────────

/** POST /api/worship/providers — create a worship listing */
export const createProvider: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const {
      name, subType, faithTradition, denomination,
      shortDescription, description,
      image, images, address, phone, email, website,
      serviceSchedule, hours,
      ministries, programmes, leaderName, leaderTitle,
      languages, serviceTags, coordinates,
    } = req.body;

    if (!name || !subType || !faithTradition || !address || !phone) {
      return next(new CustomError('name, subType, faithTradition, address, and phone are required', 400));
    }

    const slug = slugify(name) + '-' + Date.now().toString(36);

    // Build GeoJSON location from coordinates
    const location = {
      type: 'Point' as const,
      coordinates: coordinates
        ? [Number(coordinates.lng), Number(coordinates.lat)]
        : [0, 0],
    };

    const provider = await WorshipProvider.create({
      name,
      slug,
      subType,
      faithTradition,
      denomination,
      shortDescription,
      description,
      image,
      images,
      location,
      address,
      phone,
      email,
      website,
      serviceSchedule: serviceSchedule || [],
      hours: hours || [],
      ministries: ministries || [],
      programmes: programmes || [],
      leaderName,
      leaderTitle,
      languages: languages || [],
      serviceTags: serviceTags || [],
      tenant: authReq.tenant,
      owner: authReq.user!._id,
    });

    logger.info(`Worship provider created: ${provider.name} [${provider._id}]`);

    res.status(201).json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/worship/providers/:id — update a worship listing */
export const updateProvider: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    // If coordinates are being updated, convert to GeoJSON
    const update = { ...req.body };
    if (update.coordinates) {
      update.location = {
        type: 'Point',
        coordinates: [Number(update.coordinates.lng), Number(update.coordinates.lat)],
      };
      delete update.coordinates;
    }

    const provider = await WorshipProvider.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant, owner: authReq.user!._id },
      { $set: update },
      { new: true, runValidators: true },
    );

    if (!provider) return next(new CustomError('Place of worship not found or unauthorized', 404));

    res.status(200).json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/worship/providers/:id — soft-delete */
export const deleteProvider: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const provider = await WorshipProvider.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant, owner: authReq.user!._id },
      { isActive: false },
      { new: true },
    );

    if (!provider) return next(new CustomError('Place of worship not found or unauthorized', 404));

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};
