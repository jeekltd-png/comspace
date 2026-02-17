/**
 * Hotel Routes
 *
 * All routes for hotel / B&B tenant functionality:
 * properties, reservations, rate plans, add-ons,
 * availability management, and guest messaging.
 */
import { Router } from 'express';
import {
  getProperties,
  getPropertyBySlug,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/property.controller';
import {
  checkAvailability,
  createReservation,
  getMyReservations,
  getReservationByRef,
  updateReservationStatus,
  getAllReservations,
  getCalendar,
} from '../controllers/reservation.controller';
import {
  getRatePlans,
  createRatePlan,
  updateRatePlan,
  deleteRatePlan,
  getAddOns,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  blockDates,
  unblockDates,
  getMessages,
  sendMessage,
  markMessageRead,
} from '../controllers/hotel-management.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireFeature } from '../middleware/feature-gate.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// All routes are tenant-scoped
router.use(tenantMiddleware);

// Rate limit reservation creation
const reservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many reservation attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ═══════════════════════════════════════════════════════════
// ── Public Routes ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

// Properties (rooms) — public listing
router.get('/properties', requireFeature('hotel'), getProperties);
router.get('/properties/:slug', requireFeature('hotel'), getPropertyBySlug);

// Availability check — public
router.get('/availability', requireFeature('hotel'), checkAvailability);

// Add-ons — public listing
router.get('/add-ons', requireFeature('hotel'), getAddOns);

// ═══════════════════════════════════════════════════════════
// ── Guest Routes (authenticated) ───────────────────────────
// ═══════════════════════════════════════════════════════════

// Reservations — guest
router.post('/reservations', protect, requireFeature('hotel'), reservationLimiter, createReservation);
router.get('/reservations/mine', protect, requireFeature('hotel'), getMyReservations);
router.get('/reservations/:ref', protect, requireFeature('hotel'), getReservationByRef);
router.patch('/reservations/:ref/status', protect, requireFeature('hotel'), updateReservationStatus);

// Guest messaging
router.get('/messages', protect, requireFeature('hotel'), getMessages);
router.post('/messages', protect, requireFeature('hotel'), sendMessage);
router.patch('/messages/:id/read', protect, requireFeature('hotel'), markMessageRead);

// ═══════════════════════════════════════════════════════════
// ── Admin Routes ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════

// Properties CRUD — admin
router.post('/properties', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), createProperty);
router.put('/properties/:id', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), updateProperty);
router.delete('/properties/:id', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), deleteProperty);

// Reservations — admin view
router.get('/reservations', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), getAllReservations);

// Calendar — admin
router.get('/calendar', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), getCalendar);

// Rate plans — admin
router.get('/rate-plans', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), getRatePlans);
router.post('/rate-plans', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), createRatePlan);
router.put('/rate-plans/:id', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), updateRatePlan);
router.delete('/rate-plans/:id', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), deleteRatePlan);

// Add-ons — admin CRUD
router.post('/add-ons', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), createAddOn);
router.put('/add-ons/:id', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), updateAddOn);
router.delete('/add-ons/:id', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), deleteAddOn);

// Availability management — admin
router.post('/availability/block', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), blockDates);
router.post('/availability/unblock', protect, authorize('admin', 'admin1', 'admin2', 'superadmin'), unblockDates);

export default router;
