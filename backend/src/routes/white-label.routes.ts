import { Router } from 'express';
import {
  getWhiteLabelConfig,
  createWhiteLabelConfig,
  updateWhiteLabelConfig,
} from '../controllers/white-label.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { uploadFile, uploadMiddleware } from '../controllers/upload.controller';

const router = Router();

router.use(tenantMiddleware);

router.get('/config', getWhiteLabelConfig);

router.use(protect);
router.use(authorize('superadmin','admin','admin1','admin2'));

router.post('/config', createWhiteLabelConfig);
router.put('/config/:tenantId', updateWhiteLabelConfig);

// Upload endpoint for white-label assets (logo, hero)
router.post('/upload', authorize('superadmin','admin','admin1','admin2'), uploadMiddleware, uploadFile);

export default router;
