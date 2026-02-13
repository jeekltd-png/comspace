import { Router } from 'express';
import {
  trackEvent,
  trackEventsBatch,
  getAnalyticsDashboard,
  getUserActivityLog,
  getActiveUsersRealtime,
} from '../controllers/analytics.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);

// Public tracking endpoints (auth optional — tracks anonymous + logged in)
router.post('/track', trackEvent);
router.post('/track/batch', trackEventsBatch);

// Admin analytics endpoints (protected)
router.use(protect);
router.use(authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'));

router.get('/dashboard', getAnalyticsDashboard);
router.get('/users/:userId/activity', getUserActivityLog);
router.get('/realtime', getActiveUsersRealtime);

export default router;
