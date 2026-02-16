/**
 * Booking Controller
 *
 * Handles slot availability, booking creation, status updates,
 * and customer / merchant booking views.
 */
import { RequestHandler } from 'express';
import Booking from '../models/booking.model';
import SalonService from '../models/salon-service.model';
import StaffMember, { IWorkingHours } from '../models/staff-member.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// ── Helpers ──────────────────────────────────────────────────

/** Convert "HH:MM" to total minutes */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Convert total minutes back to "HH:MM" */
function minutesToTime(m: number): string {
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Compute available time slots for a given staff member on a date.
 */
async function computeAvailableSlots(
  staffId: string,
  date: string,
  durationMinutes: number,
  tenant: string,
  slotInterval = 30,
): Promise<string[]> {
  const staff = await StaffMember.findOne({ _id: staffId, tenant, isActive: true }).lean();
  if (!staff) return [];

  // Check blocked dates
  if (staff.blockedDates?.includes(date)) return [];

  // Get day-of-week (0=Sun .. 6=Sat)
  const dow = new Date(date + 'T12:00:00Z').getUTCDay();
  const schedule: IWorkingHours | undefined = staff.workingHours?.find(
    (wh: IWorkingHours) => wh.day === dow,
  );
  if (!schedule || !schedule.isOpen) return [];

  const openMin = timeToMinutes(schedule.openTime);
  const closeMin = timeToMinutes(schedule.closeTime);

  // Build break intervals
  const breaks: Array<{ start: number; end: number }> = (schedule.breaks ?? []).map(b => ({
    start: timeToMinutes(b.start),
    end: timeToMinutes(b.end),
  }));

  // Fetch existing bookings for this staff + date
  const existingBookings = await Booking.find({
    staff: staffId,
    date,
    tenant,
    status: { $nin: ['cancelled', 'no-show'] },
  })
    .select('startTime endTime')
    .lean();

  const booked = existingBookings.map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }));

  // Generate possible slots
  const slots: string[] = [];
  for (let start = openMin; start + durationMinutes <= closeMin; start += slotInterval) {
    const end = start + durationMinutes;

    // Check overlap with breaks
    const duringBreak = breaks.some(br => start < br.end && end > br.start);
    if (duringBreak) continue;

    // Check overlap with existing bookings
    const conflict = booked.some(bk => start < bk.end && end > bk.start);
    if (conflict) continue;

    slots.push(minutesToTime(start));
  }

  return slots;
}

// ── GET /api/salon/bookings/slots ────────────────────────────

/** Returns available time slots for a service + staff + date */
export const getAvailableSlots: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { serviceId, staffId, date } = req.query;

    if (!serviceId || !date) {
      return next(new CustomError('serviceId and date are required', 400));
    }

    const service = await SalonService.findOne({
      _id: serviceId,
      tenant: authReq.tenant,
      isActive: true,
    }).lean();

    if (!service) return next(new CustomError('Service not found', 404));

    // If a specific staff is requested, get their slots; otherwise aggregate all staff
    let staffList: string[] = [];
    if (staffId) {
      staffList = [staffId as string];
    } else {
      // All staff qualified for this service
      const qualifiedStaff = await StaffMember.find({
        _id: { $in: service.staffIds },
        tenant: authReq.tenant,
        isActive: true,
      }).select('_id').lean();
      staffList = qualifiedStaff.map(s => s._id.toString());
    }

    // Compute slots per staff member
    const slotsByStaff: Array<{ staffId: string; staffName: string; slots: string[] }> = [];
    for (const sid of staffList) {
      const slots = await computeAvailableSlots(
        sid,
        date as string,
        service.duration,
        authReq.tenant!,
      );
      if (slots.length > 0) {
        const sm = await StaffMember.findById(sid).select('name avatar title').lean();
        slotsByStaff.push({
          staffId: sid,
          staffName: (sm as any)?.name || 'Staff',
          slots,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        date,
        serviceId,
        duration: service.duration,
        availability: slotsByStaff,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/salon/bookings — create a booking ─────────────

export const createBooking: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { serviceId, staffId, date, startTime, notes } = req.body;

    if (!serviceId || !staffId || !date || !startTime) {
      return next(new CustomError('serviceId, staffId, date, and startTime are required', 400));
    }

    // Validate date is in the future
    const bookingDate = new Date(date + 'T' + startTime + ':00');
    if (bookingDate <= new Date()) {
      return next(new CustomError('Cannot book in the past', 400));
    }

    // Fetch service
    const service = await SalonService.findOne({
      _id: serviceId,
      tenant: authReq.tenant,
      isActive: true,
    });
    if (!service) return next(new CustomError('Service not found', 404));

    // Verify staff is qualified
    const staffIsQualified = service.staffIds.some(
      (id: any) => id.toString() === staffId,
    );
    if (!staffIsQualified) {
      return next(new CustomError('Selected staff member does not provide this service', 400));
    }

    // Verify slot is still available
    const slots = await computeAvailableSlots(
      staffId,
      date,
      service.duration,
      authReq.tenant!,
    );
    if (!slots.includes(startTime)) {
      return next(new CustomError('This time slot is no longer available', 409));
    }

    // Calculate end time
    const startMin = timeToMinutes(startTime);
    const endTime = minutesToTime(startMin + service.duration);

    const booking = await Booking.create({
      customer: authReq.user!._id,
      service: service._id,
      staff: staffId,
      date,
      startTime,
      endTime,
      duration: service.duration,
      price: service.salePrice ?? service.price,
      currency: service.currency,
      notes,
      tenant: authReq.tenant,
      vendor: service.vendor,
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    });

    logger.info(`Booking created: ${booking.bookingRef} for ${authReq.user!.email}`);

    res.status(201).json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/salon/bookings/mine — customer's bookings ───────

export const getMyBookings: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const limitNum = Math.min(Number(limit) || 20, 50);
    const skip = (Number(page) - 1) * limitNum;

    const filter: any = { customer: authReq.user!._id, tenant: authReq.tenant };
    if (status) filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort('-date -startTime')
        .skip(skip)
        .limit(limitNum)
        .populate('service', 'name slug image category duration')
        .populate('staff', 'name avatar title')
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: { page: Number(page), limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/salon/bookings/:ref — single booking detail ─────

export const getBookingByRef: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const booking = await Booking.findOne({
      bookingRef: req.params.ref.toUpperCase(),
      tenant: authReq.tenant,
    })
      .populate('service', 'name slug image category duration price currency')
      .populate('staff', 'name avatar title')
      .populate('customer', 'firstName lastName email phone')
      .lean();

    if (!booking) return next(new CustomError('Booking not found', 404));

    // Customers can only see their own bookings; merchants see their vendor's
    const userId = authReq.user!._id.toString();
    const isOwner = (booking as any).customer?._id?.toString() === userId;
    const isVendor = (booking as any).vendor?.toString() === userId;
    const isAdmin = ['admin', 'admin1', 'admin2', 'superadmin'].includes(authReq.user!.role);

    if (!isOwner && !isVendor && !isAdmin) {
      return next(new CustomError('Not authorized to view this booking', 403));
    }

    res.status(200).json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/salon/bookings/:ref/status — update status ────

export const updateBookingStatus: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { status, note } = req.body;
    const validStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return next(new CustomError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const booking = await Booking.findOne({
      bookingRef: req.params.ref.toUpperCase(),
      tenant: authReq.tenant,
    });

    if (!booking) return next(new CustomError('Booking not found', 404));

    // Only vendor (merchant) or admin can update status
    const userId = authReq.user!._id.toString();
    const isVendor = booking.vendor.toString() === userId;
    const isCustomerCancelling =
      status === 'cancelled' && booking.customer.toString() === userId;
    const isAdmin = ['admin', 'admin1', 'admin2', 'superadmin'].includes(authReq.user!.role);

    if (!isVendor && !isCustomerCancelling && !isAdmin) {
      return next(new CustomError('Not authorized to update this booking', 403));
    }

    booking.status = status;
    booking.statusHistory.push({ status, timestamp: new Date(), note });
    await booking.save();

    logger.info(`Booking ${booking.bookingRef} → ${status} by ${authReq.user!.email}`);

    res.status(200).json({ success: true, data: { booking } });
  } catch (err) {
    next(err);
  }
};

// ── Merchant: GET /api/salon/bookings/vendor — all bookings for the salon ──

export const getVendorBookings: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { date, status, staffId, page = 1, limit = 50 } = req.query;
    const limitNum = Math.min(Number(limit) || 50, 100);
    const skip = (Number(page) - 1) * limitNum;

    const filter: any = { vendor: authReq.user!._id, tenant: authReq.tenant };
    if (date) filter.date = date;
    if (status) filter.status = status;
    if (staffId) filter.staff = staffId;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort('date startTime')
        .skip(skip)
        .limit(limitNum)
        .populate('service', 'name slug category duration')
        .populate('staff', 'name avatar title')
        .populate('customer', 'firstName lastName email phone')
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: { page: Number(page), limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Staff CRUD ───────────────────────────────────────────────

function staffSlugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** GET /api/salon/staff — list active staff (public) */
export const getStaff: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const staff = await StaffMember.find({ tenant: authReq.tenant, isActive: true })
      .sort('sortOrder name')
      .populate('serviceIds', 'name slug category')
      .lean();

    res.status(200).json({ success: true, data: { staff } });
  } catch (err) {
    next(err);
  }
};

/** POST /api/salon/staff — create staff member (merchant) */
export const createStaffMember: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { name, title, bio, avatar, workingHours, serviceIds, sortOrder } = req.body;
    if (!name) return next(new CustomError('Staff name is required', 400));

    const slug = staffSlugify(name) + '-' + Date.now().toString(36);

    const member = await StaffMember.create({
      user: authReq.user!._id,
      name,
      slug,
      title,
      bio,
      avatar,
      serviceIds: serviceIds || [],
      workingHours: workingHours || undefined,
      sortOrder: sortOrder || 0,
      tenant: authReq.tenant,
      vendor: authReq.user!._id,
    });

    res.status(201).json({ success: true, data: { staff: member } });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/salon/staff/:id — update staff (merchant) */
export const updateStaffMember: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const member = await StaffMember.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant, vendor: authReq.user!._id },
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!member) return next(new CustomError('Staff member not found', 404));

    res.status(200).json({ success: true, data: { staff: member } });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/salon/staff/:id — soft-delete (merchant) */
export const deleteStaffMember: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const member = await StaffMember.findOneAndUpdate(
      { _id: req.params.id, tenant: authReq.tenant, vendor: authReq.user!._id },
      { isActive: false },
      { new: true },
    );

    if (!member) return next(new CustomError('Staff member not found', 404));

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};
