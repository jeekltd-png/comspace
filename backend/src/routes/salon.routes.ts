import { Router } from 'express';
import {
  getServices,
  getCategories,
  getServiceBySlug,
  createService,
  updateService,
  deleteService,
  assignStaff,
} from '../controllers/salon-service.controller';
import {
  getAvailableSlots,
  createBooking,
  getMyBookings,
  getBookingByRef,
  updateBookingStatus,
  getVendorBookings,
  getStaff,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from '../controllers/booking.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// All routes are tenant-scoped
router.use(tenantMiddleware);

// Rate limit booking creation to prevent abuse
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many booking attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public — Services ──────────────────────────────────────
router.get('/services', getServices);
router.get('/services/categories', getCategories);
router.get('/services/:slug', getServiceBySlug);

// ── Public — Staff ─────────────────────────────────────────
router.get('/staff', getStaff);

// ── Public — Available slots ───────────────────────────────
router.get('/bookings/slots', getAvailableSlots);

// ── Customer — Bookings ────────────────────────────────────
router.post('/bookings', protect, bookingLimiter, createBooking);
router.get('/bookings/mine', protect, getMyBookings);
router.get('/bookings/:ref', protect, getBookingByRef);
router.patch('/bookings/:ref/status', protect, updateBookingStatus);

// ── Merchant — Services CRUD ───────────────────────────────
router.post('/services', protect, authorize('merchant', 'admin', 'superadmin'), createService);
router.put('/services/:id', protect, authorize('merchant', 'admin', 'superadmin'), updateService);
router.delete('/services/:id', protect, authorize('merchant', 'admin', 'superadmin'), deleteService);
router.put('/services/:id/staff', protect, authorize('merchant', 'admin', 'superadmin'), assignStaff);

// ── Merchant — Staff CRUD ──────────────────────────────────
router.post('/staff', protect, authorize('merchant', 'admin', 'superadmin'), createStaffMember);
router.put('/staff/:id', protect, authorize('merchant', 'admin', 'superadmin'), updateStaffMember);
router.delete('/staff/:id', protect, authorize('merchant', 'admin', 'superadmin'), deleteStaffMember);

// ── Merchant — View salon bookings ─────────────────────────
router.get('/bookings/vendor/all', protect, authorize('merchant', 'admin', 'superadmin'), getVendorBookings);

export default router;
