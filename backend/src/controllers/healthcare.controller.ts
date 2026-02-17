/**
 * Healthcare Controller
 *
 * CRUD for healthcare providers + public browse / search / discovery.
 */
import { RequestHandler } from 'express';
import HealthcareProvider from '../models/healthcare-provider.model';
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

/** GET /api/healthcare/providers — list active providers for a tenant */
export const getProviders: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { subType, specialty, search, page = 1, limit = 20 } = req.query;
    const limitNum = Math.min(Number(limit) || 20, 50);

    const filter: any = { tenant: authReq.tenant, isActive: true };
    if (subType) filter.subType = subType;
    if (specialty) filter.specialties = specialty;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialties: { $regex: search, $options: 'i' } },
        { serviceTags: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * limitNum;

    const [providers, total] = await Promise.all([
      HealthcareProvider.find(filter)
        .sort('-rating name')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      HealthcareProvider.countDocuments(filter),
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

/** GET /api/healthcare/providers/specialties — distinct specialties */
export const getSpecialties: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const specialties = await HealthcareProvider.distinct('specialties', {
      tenant: authReq.tenant,
      isActive: true,
    });
    res.status(200).json({ success: true, data: { specialties } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/healthcare/providers/sub-types — distinct sub-types */
export const getSubTypes: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const subTypes = await HealthcareProvider.distinct('subType', {
      tenant: authReq.tenant,
      isActive: true,
    });
    res.status(200).json({ success: true, data: { subTypes } });
  } catch (err) {
    next(err);
  }
};

/** GET /api/healthcare/providers/:slug — single provider detail */
export const getProviderBySlug: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const provider = await HealthcareProvider.findOne({
      slug: req.params.slug,
      tenant: authReq.tenant,
      isActive: true,
    }).lean();

    if (!provider) return next(new CustomError('Healthcare provider not found', 404));
    res.status(200).json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

// ── Merchant / Admin CRUD ────────────────────────────────────

/** POST /api/healthcare/providers — create a provider listing */
export const createProvider: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const {
      name, subType, specialties, shortDescription, description,
      image, images, address, phone, email, website,
      hours, isEmergency, languages, insuranceAccepted, serviceTags,
      coordinates,
    } = req.body;

    if (!name || !subType || !address || !phone) {
      return next(new CustomError('name, subType, address, and phone are required', 400));
    }

    const slug = slugify(name) + '-' + Date.now().toString(36);

    // Build GeoJSON location from coordinates
    const location = {
      type: 'Point' as const,
      coordinates: coordinates
        ? [Number(coordinates.lng), Number(coordinates.lat)]
        : [0, 0],
    };

    const provider = await HealthcareProvider.create({
      name,
      slug,
      subType,
      specialties: specialties || [],
      shortDescription,
      description,
      image,
      images,
      location,
      address,
      phone,
      email,
      website,
      hours: hours || [],
      isEmergency: isEmergency || false,
      languages: languages || [],
      insuranceAccepted: insuranceAccepted || [],
      serviceTags: serviceTags || [],
      tenant: authReq.tenant,
      owner: authReq.user!._id,
    });

    logger.info(`Healthcare provider created: ${provider.name} [${provider._id}]`);

    res.status(201).json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/healthcare/providers/:id — update a provider */
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

    const provider = await HealthcareProvider.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant, owner: authReq.user!._id },
      { $set: update },
      { new: true, runValidators: true },
    );

    if (!provider) return next(new CustomError('Provider not found or unauthorized', 404));

    res.status(200).json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/healthcare/providers/:id — soft-delete */
export const deleteProvider: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const provider = await HealthcareProvider.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant, owner: authReq.user!._id },
      { isActive: false },
      { new: true },
    );

    if (!provider) return next(new CustomError('Provider not found or unauthorized', 404));

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};
