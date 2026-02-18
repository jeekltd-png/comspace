import { Router } from 'express';
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from '../controllers/coupon.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(protect);

// Customer-facing: validate a coupon code
router.post('/validate', validateCoupon);

// Admin routes
router.get('/', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), listCoupons);
router.post('/', authorize('superadmin', 'admin', 'admin1', 'admin2'), createCoupon);
router.patch('/:id', authorize('superadmin', 'admin', 'admin1', 'admin2'), updateCoupon);
router.delete('/:id', authorize('superadmin', 'admin', 'admin1'), deleteCoupon);

export default router;
