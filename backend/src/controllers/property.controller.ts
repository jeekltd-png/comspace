/**
 * Property Controller
 *
 * CRUD operations for hotel / B&B rooms/properties.
 * Public listing + admin management.
 */
import { RequestHandler } from 'express';
import Property from '../models/property.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// ── GET /api/hotel/properties — list properties (public) ────

export const getProperties: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const {
      type,
      minPrice,
      maxPrice,
      guests,
      amenity,
      tag,
      page = 1,
      limit = 20,
      sort = 'sortOrder',
    } = req.query;

    const limitNum = Math.min(Number(limit) || 20, 50);
    const skip = (Number(page) - 1) * limitNum;

    const filter: any = { tenant: authReq.tenant, isActive: true, status: 'available' };
    if (type) filter.type = type;
    if (guests) filter.maxGuests = { $gte: Number(guests) };
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }
    if (amenity) filter.amenities = { $in: (amenity as string).split(',') };
    if (tag) filter.tags = { $in: (tag as string).split(',') };

    // Determine sort order
    let sortObj: any = { sortOrder: 1, name: 1 };
    if (sort === 'price_asc') sortObj = { basePrice: 1 };
    else if (sort === 'price_desc') sortObj = { basePrice: -1 };
    else if (sort === 'name') sortObj = { name: 1 };

    const [properties, total] = await Promise.all([
      Property.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Property.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        properties,
        pagination: {
          page: Number(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hotel/properties/:slug — single property ───────

export const getPropertyBySlug: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const property = await Property.findOne({
      slug: req.params.slug,
      tenant: authReq.tenant,
      isActive: true,
    }).lean();

    if (!property) return next(new CustomError('Property not found', 404));

    res.status(200).json({ success: true, data: { property } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/hotel/properties — create property (admin) ────

export const createProperty: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const {
      name, type, description, shortDescription, amenities, images,
      maxGuests, beds, bathrooms, sizeSqm, floor, basePrice, currency,
      policies, tags, sortOrder,
    } = req.body;

    if (!name || !description || !maxGuests || basePrice === undefined) {
      return next(new CustomError('name, description, maxGuests, and basePrice are required', 400));
    }

    const property = await Property.create({
      name,
      type: type || 'room',
      description,
      shortDescription,
      amenities: amenities || [],
      images: images || [],
      maxGuests,
      beds: beds || 1,
      bathrooms: bathrooms || 1,
      sizeSqm,
      floor,
      basePrice,
      currency: currency || 'GBP',
      policies: policies || {},
      tags: tags || [],
      sortOrder: sortOrder || 0,
      tenant: authReq.tenant,
    });

    logger.info(`Property created: ${property.propertyCode} by ${authReq.user!.email}`);

    res.status(201).json({ success: true, data: { property } });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/hotel/properties/:id — update property (admin) ─

export const updateProperty: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const allowedFields = [
      'name', 'type', 'description', 'shortDescription', 'amenities', 'images',
      'maxGuests', 'beds', 'bathrooms', 'sizeSqm', 'floor', 'basePrice', 'currency',
      'status', 'policies', 'tags', 'sortOrder', 'isActive',
    ];

    const updates: any = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Regenerate slug if name changed
    if (updates.name) {
      updates.slug = (updates.name as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);
    }

    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!property) return next(new CustomError('Property not found', 404));

    res.status(200).json({ success: true, data: { property } });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/hotel/properties/:id — soft-delete (admin) ──

export const deleteProperty: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      { isActive: false, status: 'retired' },
      { new: true },
    );

    if (!property) return next(new CustomError('Property not found', 404));

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};
