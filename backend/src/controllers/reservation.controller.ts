/**
 * Reservation Controller
 *
 * Handles availability search, reservation creation, status updates,
 * and guest / admin reservation views for hotel / B&B tenants.
 */
import { RequestHandler } from 'express';
import Reservation from '../models/reservation.model';
import Property from '../models/property.model';
import Availability from '../models/availability.model';
import RatePlan from '../models/rate-plan.model';
import HotelAddOn from '../models/hotel-addon.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Generate an array of date strings between two dates (inclusive of start, exclusive of end).
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  while (current < end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Compute nightly price for a property on a specific date using rate plans.
 */
async function computeNightlyPrice(
  propertyId: string,
  date: string,
  basePrice: number,
  tenant: string,
): Promise<{ price: number; ratePlanName?: string }> {
  // Find applicable rate plans (sorted by priority desc)
  const ratePlans = await RatePlan.find({
    property: propertyId,
    tenant,
    isActive: true,
    startDate: { $lte: date },
    endDate: { $gte: date },
  })
    .sort({ priority: -1 })
    .lean();

  if (ratePlans.length === 0) {
    return { price: basePrice };
  }

  // Use highest priority rate plan
  const plan = ratePlans[0];
  let price = plan.pricePerNight;

  // Apply day-of-week modifier
  const dow = new Date(date + 'T12:00:00Z').getUTCDay();
  const dayMod = plan.dayModifiers?.find(m => m.day === dow);
  if (dayMod && dayMod.modifier !== 0) {
    price = price * (1 + dayMod.modifier / 100);
  }

  return { price: Math.round(price * 100) / 100, ratePlanName: plan.name };
}

// ── GET /api/hotel/availability — check availability ────────

export const checkAvailability: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { checkIn, checkOut, guests, propertyId } = req.query;

    if (!checkIn || !checkOut) {
      return next(new CustomError('checkIn and checkOut dates are required', 400));
    }

    const checkInStr = checkIn as string;
    const checkOutStr = checkOut as string;

    // Validate dates
    if (new Date(checkInStr) >= new Date(checkOutStr)) {
      return next(new CustomError('Check-out must be after check-in', 400));
    }

    if (new Date(checkInStr) < new Date(new Date().toISOString().slice(0, 10))) {
      return next(new CustomError('Check-in date cannot be in the past', 400));
    }

    const dateRange = getDateRange(checkInStr, checkOutStr);

    // Base query for properties
    const propertyFilter: any = {
      tenant: authReq.tenant,
      isActive: true,
      status: 'available',
    };
    if (propertyId) propertyFilter._id = propertyId;
    if (guests) propertyFilter.maxGuests = { $gte: Number(guests) };

    const properties = await Property.find(propertyFilter).lean();

    // Check each property's availability
    const available: any[] = [];

    for (const prop of properties) {
      // Check if any dates are blocked/booked
      const blockedDates = await Availability.find({
        property: prop._id,
        tenant: authReq.tenant,
        date: { $in: dateRange },
        status: { $in: ['booked', 'blocked', 'maintenance'] },
      })
        .select('date status')
        .lean();

      if (blockedDates.length > 0) continue; // Not available

      // Check minimum/maximum stay
      const nights = dateRange.length;
      if (nights < prop.policies.minStay || nights > prop.policies.maxStay) continue;

      // Compute pricing for each night
      const nightlyBreakdown = [];
      let subtotal = 0;

      for (const date of dateRange) {
        const { price, ratePlanName } = await computeNightlyPrice(
          prop._id.toString(),
          date,
          prop.basePrice,
          authReq.tenant!,
        );
        nightlyBreakdown.push({
          date,
          basePrice: prop.basePrice,
          modifiedPrice: price,
          ratePlan: ratePlanName,
        });
        subtotal += price;
      }

      available.push({
        property: prop,
        nights,
        nightlyBreakdown,
        subtotal: Math.round(subtotal * 100) / 100,
        currency: prop.currency,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights: dateRange.length,
        available,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/hotel/reservations — create reservation ───────

export const createReservation: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { propertyId, checkIn, checkOut, guests, addOnIds, specialRequests } = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      return next(new CustomError('propertyId, checkIn, and checkOut are required', 400));
    }

    // Validate dates
    if (new Date(checkIn) >= new Date(checkOut)) {
      return next(new CustomError('Check-out must be after check-in', 400));
    }

    if (new Date(checkIn) < new Date(new Date().toISOString().slice(0, 10))) {
      return next(new CustomError('Check-in date cannot be in the past', 400));
    }

    // Fetch property
    const property = await Property.findOne({
      _id: propertyId,
      tenant: authReq.tenant,
      isActive: true,
      status: 'available',
    });
    if (!property) return next(new CustomError('Property not found or unavailable', 404));

    const dateRange = getDateRange(checkIn, checkOut);
    const nights = dateRange.length;

    // Validate stay length
    if (nights < property.policies.minStay) {
      return next(new CustomError(`Minimum stay is ${property.policies.minStay} night(s)`, 400));
    }
    if (nights > property.policies.maxStay) {
      return next(new CustomError(`Maximum stay is ${property.policies.maxStay} night(s)`, 400));
    }

    // Validate guest count
    const totalGuests = (guests?.adults || 1) + (guests?.children || 0);
    if (totalGuests > property.maxGuests) {
      return next(new CustomError(`Maximum ${property.maxGuests} guests allowed`, 400));
    }

    // Check availability (no double booking)
    const blocked = await Availability.find({
      property: propertyId,
      tenant: authReq.tenant,
      date: { $in: dateRange },
      status: { $in: ['booked', 'blocked', 'maintenance'] },
    }).lean();

    if (blocked.length > 0) {
      return next(new CustomError('Some dates are no longer available', 409));
    }

    // Compute pricing
    const nightlyBreakdown = [];
    let subtotal = 0;

    for (const date of dateRange) {
      const { price, ratePlanName } = await computeNightlyPrice(
        propertyId,
        date,
        property.basePrice,
        authReq.tenant!,
      );
      nightlyBreakdown.push({
        date,
        basePrice: property.basePrice,
        modifiedPrice: price,
        ratePlan: ratePlanName,
      });
      subtotal += price;
    }

    // Process add-ons
    const addOnEntries: any[] = [];
    let addOnsTotal = 0;

    if (addOnIds && addOnIds.length > 0) {
      const addOns = await HotelAddOn.find({
        _id: { $in: addOnIds },
        tenant: authReq.tenant,
        isActive: true,
      }).lean();

      for (const addOn of addOns) {
        let quantity = 1;
        if (addOn.per === 'night') quantity = nights;
        else if (addOn.per === 'guest') quantity = guests?.adults || 1;

        const total = addOn.price * quantity;
        addOnsTotal += total;

        addOnEntries.push({
          addOn: addOn._id,
          name: addOn.name,
          quantity,
          unitPrice: addOn.price,
          total,
        });
      }
    }

    const total = Math.round((subtotal + addOnsTotal) * 100) / 100;

    // Create reservation
    const reservation = await Reservation.create({
      property: propertyId,
      guest: authReq.user!._id,
      checkIn,
      checkOut,
      nights,
      guests: {
        adults: guests?.adults || 1,
        children: guests?.children || 0,
        infants: guests?.infants || 0,
      },
      status: 'pending',
      source: 'direct',
      pricing: {
        nightlyBreakdown,
        subtotal: Math.round(subtotal * 100) / 100,
        taxes: 0,
        fees: 0,
        addOns: addOnEntries,
        discount: 0,
        total,
        currency: property.currency,
      },
      payment: {
        depositAmount: Math.round(total * 0.2 * 100) / 100, // 20% deposit
        depositPaid: false,
        balanceDue: total,
        paymentStatus: 'unpaid',
      },
      specialRequests,
      tenant: authReq.tenant,
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    });

    // Mark dates as booked
    const availabilityDocs = dateRange.map(date => ({
      property: propertyId,
      date,
      status: 'booked' as const,
      reservation: reservation._id,
      tenant: authReq.tenant,
    }));

    await Availability.insertMany(availabilityDocs, { ordered: false }).catch(() => {
      // If some already exist, update them
      return Promise.all(
        availabilityDocs.map(doc =>
          Availability.findOneAndUpdate(
            { property: doc.property, date: doc.date, tenant: doc.tenant },
            { $set: { status: 'booked', reservation: doc.reservation } },
            { upsert: true },
          ),
        ),
      );
    });

    logger.info(`Reservation created: ${reservation.reservationRef} by ${authReq.user!.email}`);

    res.status(201).json({ success: true, data: { reservation } });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hotel/reservations/mine — guest's reservations ─

export const getMyReservations: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const limitNum = Math.min(Number(limit) || 20, 50);
    const skip = (Number(page) - 1) * limitNum;

    const filter: any = { guest: authReq.user!._id, tenant: authReq.tenant };
    if (status) filter.status = status;

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .sort('-checkIn')
        .skip(skip)
        .limit(limitNum)
        .populate('property', 'name slug type images basePrice currency')
        .lean(),
      Reservation.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reservations,
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

// ── GET /api/hotel/reservations/:ref — single reservation ───

export const getReservationByRef: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const reservation = await Reservation.findOne({
      reservationRef: req.params.ref.toUpperCase(),
      tenant: authReq.tenant,
    })
      .populate('property', 'name slug type images basePrice currency policies amenities')
      .populate('guest', 'firstName lastName email phone')
      .populate('pricing.addOns.addOn', 'name description per')
      .lean();

    if (!reservation) return next(new CustomError('Reservation not found', 404));

    // Access control
    const userId = authReq.user!._id.toString();
    const isGuest = (reservation as any).guest?._id?.toString() === userId;
    const isAdmin = ['admin', 'admin1', 'admin2', 'superadmin'].includes(authReq.user!.role);

    if (!isGuest && !isAdmin) {
      return next(new CustomError('Not authorized to view this reservation', 403));
    }

    res.status(200).json({ success: true, data: { reservation } });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/hotel/reservations/:ref/status — update status

export const updateReservationStatus: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { status, note } = req.body;
    const validStatuses = ['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return next(new CustomError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const reservation = await Reservation.findOne({
      reservationRef: req.params.ref.toUpperCase(),
      tenant: authReq.tenant,
    });

    if (!reservation) return next(new CustomError('Reservation not found', 404));

    const userId = authReq.user!._id.toString();
    const isGuest = reservation.guest.toString() === userId;
    const isAdmin = ['admin', 'admin1', 'admin2', 'superadmin'].includes(authReq.user!.role);
    const isGuestCancelling = status === 'cancelled' && isGuest;

    if (!isAdmin && !isGuestCancelling) {
      return next(new CustomError('Not authorized to update this reservation', 403));
    }

    // Handle cancellation — free up dates
    if (status === 'cancelled') {
      const dateRange = getDateRange(reservation.checkIn, reservation.checkOut);
      await Availability.deleteMany({
        property: reservation.property,
        tenant: authReq.tenant,
        date: { $in: dateRange },
        reservation: reservation._id,
      });

      reservation.cancellation = {
        policy: 'standard',
        refundAmount: 0,
        cancelledAt: new Date(),
        reason: note || 'Guest cancelled',
      };
    }

    reservation.status = status;
    reservation.statusHistory.push({
      status,
      timestamp: new Date(),
      note,
      updatedBy: authReq.user!._id,
    });
    await reservation.save();

    logger.info(
      `Reservation ${reservation.reservationRef} → ${status} by ${authReq.user!.email}`,
    );

    res.status(200).json({ success: true, data: { reservation } });
  } catch (err) {
    next(err);
  }
};

// ── Admin: GET /api/hotel/reservations — all reservations ───

export const getAllReservations: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { status, checkIn, checkOut, propertyId, page = 1, limit = 50 } = req.query;
    const limitNum = Math.min(Number(limit) || 50, 100);
    const skip = (Number(page) - 1) * limitNum;

    const filter: any = { tenant: authReq.tenant };
    if (status) filter.status = status;
    if (propertyId) filter.property = propertyId;
    if (checkIn) filter.checkIn = { $gte: checkIn };
    if (checkOut) filter.checkOut = { $lte: checkOut };

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .populate('property', 'name slug type propertyCode')
        .populate('guest', 'firstName lastName email phone')
        .lean(),
      Reservation.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reservations,
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

// ── Admin: GET /api/hotel/calendar — calendar view ──────────

export const getCalendar: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { startDate, endDate, propertyId } = req.query;

    if (!startDate || !endDate) {
      return next(new CustomError('startDate and endDate are required', 400));
    }

    const filter: any = {
      tenant: authReq.tenant,
      date: { $gte: startDate, $lte: endDate },
    };
    if (propertyId) filter.property = propertyId;

    const availability = await Availability.find(filter)
      .populate('property', 'name propertyCode type')
      .populate('reservation', 'reservationRef guest status checkIn checkOut')
      .lean();

    // Get all properties for the tenant to include empty calendar slots
    const propertyFilter: any = { tenant: authReq.tenant, isActive: true };
    if (propertyId) propertyFilter._id = propertyId;
    const properties = await Property.find(propertyFilter)
      .select('name propertyCode type basePrice')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        startDate,
        endDate,
        properties,
        availability,
      },
    });
  } catch (err) {
    next(err);
  }
};
