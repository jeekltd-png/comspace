/**
 * Hotel Management Controller
 *
 * Handles rate plans, add-ons, availability management,
 * and guest messaging for hotel / B&B tenants.
 */
import { RequestHandler } from 'express';
import RatePlan from '../models/rate-plan.model';
import HotelAddOn from '../models/hotel-addon.model';
import Availability from '../models/availability.model';
import GuestMessage from '../models/guest-message.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// ═══════════════════════════════════════════════════════════
// ── Rate Plans ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

/** GET /api/hotel/rate-plans — list rate plans for a property */
export const getRatePlans: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { propertyId, active } = req.query;
    const filter: any = { tenant: authReq.tenant };
    if (propertyId) filter.property = propertyId;
    if (active !== undefined) filter.isActive = active === 'true';

    const ratePlans = await RatePlan.find(filter)
      .sort({ priority: -1, startDate: 1 })
      .populate('property', 'name propertyCode')
      .lean();

    res.status(200).json({ success: true, data: { ratePlans } });
  } catch (err) {
    next(err);
  }
};

/** POST /api/hotel/rate-plans — create rate plan (admin) */
export const createRatePlan: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { name, description, property, startDate, endDate, pricePerNight, currency, dayModifiers, minStay, priority } = req.body;

    if (!name || !property || !startDate || !endDate || pricePerNight === undefined) {
      return next(new CustomError('name, property, startDate, endDate, and pricePerNight are required', 400));
    }

    if (new Date(startDate) > new Date(endDate)) {
      return next(new CustomError('startDate must be before endDate', 400));
    }

    const ratePlan = await RatePlan.create({
      name,
      description,
      property,
      startDate,
      endDate,
      pricePerNight,
      currency: currency || 'GBP',
      dayModifiers: dayModifiers || [],
      minStay: minStay || 1,
      priority: priority || 0,
      tenant: authReq.tenant,
    });

    logger.info(`Rate plan created: ${ratePlan.name} by ${authReq.user!.email}`);

    res.status(201).json({ success: true, data: { ratePlan } });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/hotel/rate-plans/:id — update rate plan (admin) */
export const updateRatePlan: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const allowedFields = [
      'name', 'description', 'startDate', 'endDate', 'pricePerNight',
      'currency', 'dayModifiers', 'minStay', 'priority', 'isActive',
    ];

    const updates: any = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const ratePlan = await RatePlan.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!ratePlan) return next(new CustomError('Rate plan not found', 404));

    res.status(200).json({ success: true, data: { ratePlan } });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/hotel/rate-plans/:id — soft-delete (admin) */
export const deleteRatePlan: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const ratePlan = await RatePlan.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      { isActive: false },
      { new: true },
    );

    if (!ratePlan) return next(new CustomError('Rate plan not found', 404));

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════
// ── Add-Ons ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

/** GET /api/hotel/add-ons — list add-ons (public) */
export const getAddOns: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { category } = req.query;
    const filter: any = { tenant: authReq.tenant, isActive: true };
    if (category) filter.category = category;

    const addOns = await HotelAddOn.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.status(200).json({ success: true, data: { addOns } });
  } catch (err) {
    next(err);
  }
};

/** POST /api/hotel/add-ons — create add-on (admin) */
export const createAddOn: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { name, description, price, currency, per, category, sortOrder } = req.body;

    if (!name || price === undefined || !per) {
      return next(new CustomError('name, price, and per are required', 400));
    }

    const addOn = await HotelAddOn.create({
      name,
      description,
      price,
      currency: currency || 'GBP',
      per,
      category,
      sortOrder: sortOrder || 0,
      tenant: authReq.tenant,
    });

    res.status(201).json({ success: true, data: { addOn } });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/hotel/add-ons/:id — update add-on (admin) */
export const updateAddOn: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const allowedFields = ['name', 'description', 'price', 'currency', 'per', 'category', 'sortOrder', 'isActive'];
    const updates: any = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const addOn = await HotelAddOn.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!addOn) return next(new CustomError('Add-on not found', 404));

    res.status(200).json({ success: true, data: { addOn } });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/hotel/add-ons/:id — soft-delete (admin) */
export const deleteAddOn: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const addOn = await HotelAddOn.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      { isActive: false },
      { new: true },
    );

    if (!addOn) return next(new CustomError('Add-on not found', 404));

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════
// ── Availability Management ────────────────────────────────
// ═══════════════════════════════════════════════════════════

/** POST /api/hotel/availability/block — block dates (admin) */
export const blockDates: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { propertyId, startDate, endDate, reason } = req.body;

    if (!propertyId || !startDate || !endDate) {
      return next(new CustomError('propertyId, startDate, and endDate are required', 400));
    }

    const dates: string[] = [];
    const current = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    while (current <= end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Upsert availability records
    const ops = dates.map(date => ({
      updateOne: {
        filter: { property: propertyId, date, tenant: authReq.tenant },
        update: {
          $set: {
            status: 'blocked' as const,
            note: reason || 'Blocked by admin',
            tenant: authReq.tenant!,
            property: propertyId,
            date,
          },
        },
        upsert: true,
      },
    }));

    await Availability.bulkWrite(ops as any);

    logger.info(
      `Dates blocked: ${startDate} to ${endDate} for property ${propertyId} by ${authReq.user!.email}`,
    );

    res.status(200).json({
      success: true,
      data: { blocked: dates.length, startDate, endDate },
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/hotel/availability/unblock — unblock dates (admin) */
export const unblockDates: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { propertyId, startDate, endDate } = req.body;

    if (!propertyId || !startDate || !endDate) {
      return next(new CustomError('propertyId, startDate, and endDate are required', 400));
    }

    const dates: string[] = [];
    const current = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    while (current <= end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Only remove blocked entries (not booked ones)
    await Availability.deleteMany({
      property: propertyId,
      tenant: authReq.tenant,
      date: { $in: dates },
      status: 'blocked',
    });

    res.status(200).json({
      success: true,
      data: { unblocked: dates.length, startDate, endDate },
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════
// ── Guest Messaging ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

/** GET /api/hotel/messages — list messages for a reservation */
export const getMessages: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { reservationId, page = 1, limit = 50 } = req.query;
    const limitNum = Math.min(Number(limit) || 50, 100);
    const skip = (Number(page) - 1) * limitNum;

    const filter: any = { tenant: authReq.tenant };
    if (reservationId) filter.reservation = reservationId;

    // Non-admins can only see their own messages
    const isAdmin = ['admin', 'admin1', 'admin2', 'superadmin'].includes(authReq.user!.role);
    if (!isAdmin) {
      filter.$or = [
        { sender: authReq.user!._id },
        { recipient: authReq.user!._id },
      ];
    }

    const [messages, total] = await Promise.all([
      GuestMessage.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('sender', 'firstName lastName email')
        .populate('recipient', 'firstName lastName email')
        .lean(),
      GuestMessage.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        messages,
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

/** POST /api/hotel/messages — send a message */
export const sendMessage: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { reservationId, recipientId, type, subject, message, attachments } = req.body;

    if (!message) {
      return next(new CustomError('Message is required', 400));
    }

    const isAdmin = ['admin', 'admin1', 'admin2', 'superadmin'].includes(authReq.user!.role);

    const guestMessage = await GuestMessage.create({
      reservation: reservationId,
      sender: authReq.user!._id,
      recipient: recipientId,
      type: type || 'general',
      subject,
      message,
      attachments: attachments || [],
      isFromGuest: !isAdmin,
      tenant: authReq.tenant,
    });

    res.status(201).json({ success: true, data: { message: guestMessage } });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/hotel/messages/:id/read — mark message as read */
export const markMessageRead: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const msg = await GuestMessage.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant },
      { readAt: new Date() },
      { new: true },
    );

    if (!msg) return next(new CustomError('Message not found', 404));

    res.status(200).json({ success: true, data: { message: msg } });
  } catch (err) {
    next(err);
  }
};
