import { Router } from 'express';
import {
  getVendors,
  getVendorBySlug,
  getMyVendorProfile,
  createMyVendorProfile,
  updateMyVendorProfile,
  getMyVendorStats,
  getMyVendorOrders,
  adminGetAllVendors,
  adminApproveVendor,
} from '../controllers/vendor.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);

// ─── Public ───────────────────────────────────────────────────────────────
router.get('/', getVendors);
router.get('/profile/:slug', getVendorBySlug);

// ─── Merchant (own profile) ──────────────────────────────────────────────
router.get('/me', protect, authorize('merchant'), getMyVendorProfile);
router.post('/me', protect, authorize('merchant'), createMyVendorProfile);
router.put('/me', protect, authorize('merchant'), updateMyVendorProfile);
router.get('/me/stats', protect, authorize('merchant'), getMyVendorStats);
router.get('/me/orders', protect, authorize('merchant'), getMyVendorOrders);

// ─── Admin ────────────────────────────────────────────────────────────────
router.get('/admin/all', protect, authorize('admin', 'superadmin', 'admin1', 'admin2'), adminGetAllVendors);
router.patch('/admin/:id/approve', protect, authorize('admin', 'superadmin', 'admin1', 'admin2'), adminApproveVendor);

export default router;
