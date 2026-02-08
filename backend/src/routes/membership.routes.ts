import { Router } from 'express';
import {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
  subscribe,
  getMyMembership,
  getMyDues,
  payDues,
  confirmDuesPayment,
  cancelMembership,
  listMembers,
  updateMemberStatus,
  recordManualPayment,
  getDuesDashboard,
  getAllDues,
  exportDues,
} from '../controllers/membership.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(protect);

// ─── Public (authenticated member) routes ────────────
router.get('/plans', getPlans);
router.post('/subscribe', subscribe);
router.get('/me', getMyMembership);
router.get('/me/dues', getMyDues);
router.post('/pay', payDues);
router.post('/confirm-payment', confirmDuesPayment);
router.post('/cancel', cancelMembership);

// ─── Admin routes ────────────────────────────────────
router.post('/plans', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), createPlan);
router.put('/plans/:id', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), updatePlan);
router.delete('/plans/:id', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), deletePlan);

router.get('/members', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), listMembers);
router.patch('/members/:id/status', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), updateMemberStatus);
router.post('/members/record-payment', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), recordManualPayment);

router.get('/dashboard', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), getDuesDashboard);
router.get('/dues', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), getAllDues);
router.get('/dues/export', authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'), exportDues);

export default router;
