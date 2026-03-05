import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  apply,
  getMyProfile,
  listPartners,
  updatePartnerStatus,
  recordPayout,
  validateCode,
} from '../controllers/partner.controller';

const router = Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/validate/:code', validateCode);

// ── Authenticated ────────────────────────────────────────────────────────────
router.use(protect);
router.post('/apply', apply);
router.get('/me', getMyProfile);

// ── SuperAdmin only ──────────────────────────────────────────────────────────
router.get('/', authorize('superadmin'), listPartners);
router.patch('/:id/status', authorize('superadmin'), updatePartnerStatus);
router.post('/:id/payout', authorize('superadmin'), recordPayout);

export default router;
