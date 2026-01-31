import { Router } from 'express';
import {
  getWhiteLabelConfig,
  createWhiteLabelConfig,
  updateWhiteLabelConfig,
} from '../controllers/white-label.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);

router.get('/config', getWhiteLabelConfig);

router.use(protect);
router.use(authorize('admin'));

router.post('/config', createWhiteLabelConfig);
router.put('/config/:tenantId', updateWhiteLabelConfig);

export default router;
