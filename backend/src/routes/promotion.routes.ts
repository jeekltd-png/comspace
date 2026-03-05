import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import {
  createPromotion,
  getPromotions,
  updatePromotionStatus,
  recordClick,
  recordImpression,
  getActivePromotions,
  getPromotionStats,
} from '../controllers/promotion.controller';

const router = Router();

router.use(tenantMiddleware);

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/active', getActivePromotions);
router.post('/:id/click', recordClick);
router.post('/:id/impression', recordImpression);

// ── Authenticated ────────────────────────────────────────────────────────────
router.use(protect);
router.post('/', authorize('merchant', 'admin', 'superadmin'), createPromotion);
router.get('/', getPromotions);
router.get('/stats', authorize('admin', 'admin1', 'superadmin'), getPromotionStats);
router.patch('/:id/status', authorize('admin', 'admin1', 'superadmin'), updatePromotionStatus);

export default router;
