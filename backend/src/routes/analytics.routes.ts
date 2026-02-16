import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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

// Rate limiter for tracking endpoints — prevent abuse
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many tracking requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public tracking endpoints (auth optional — tracks anonymous + logged in)
router.post('/track', trackingLimiter, trackEvent);
router.post('/track/batch', trackingLimiter, trackEventsBatch);

// Admin analytics endpoints (protected)
router.use(protect);
router.use(authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'));

router.get('/dashboard', getAnalyticsDashboard);
router.get('/users/:userId/activity', getUserActivityLog);
router.get('/realtime', getActiveUsersRealtime);

export default router;
