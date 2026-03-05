import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import {
  getPlans,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  subscribe,
  getSubscription,
  cancelSubscription,
  getCommissions,
  getRevenueDashboard,
} from '../controllers/billing.controller';
import { getApiUsage } from '../controllers/apiUsage.controller';

const router = Router();

router.use(tenantMiddleware);

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/plans', getPlans);

// ── Authenticated (tenant admin) ─────────────────────────────────────────────
router.use(protect);
router.post('/subscribe', subscribe);
router.get('/subscription', getSubscription);
router.post('/cancel', cancelSubscription);
router.get('/commissions', getCommissions);
router.get('/api-usage', getApiUsage);

// ── SuperAdmin only ──────────────────────────────────────────────────────────
router.get('/plans/all', authorize('superadmin'), getAllPlans);
router.post('/plans', authorize('superadmin'), createPlan);
router.put('/plans/:id', authorize('superadmin'), updatePlan);
router.delete('/plans/:id', authorize('superadmin'), deletePlan);
router.get('/revenue', authorize('superadmin'), getRevenueDashboard);

export default router;
