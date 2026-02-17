import { Router } from 'express';
import {
  getProviders,
  getFaithTraditions,
  getSubTypes,
  getProviderBySlug,
  createProvider,
  updateProvider,
  deleteProvider,
} from '../controllers/worship.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// All routes are tenant-scoped
router.use(tenantMiddleware);

// ── Public — Browse places of worship ──────────────────────
router.get('/providers', getProviders);
router.get('/providers/faith-traditions', getFaithTraditions);
router.get('/providers/sub-types', getSubTypes);
router.get('/providers/:slug', getProviderBySlug);

// ── Merchant / Admin — CRUD ────────────────────────────────
router.post('/providers', protect, authorize('merchant', 'admin', 'superadmin'), createProvider);
router.put('/providers/:id', protect, authorize('merchant', 'admin', 'superadmin'), updateProvider);
router.delete('/providers/:id', protect, authorize('merchant', 'admin', 'superadmin'), deleteProvider);

export default router;
