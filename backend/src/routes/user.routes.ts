import { Router } from 'express';
import { getProfile, updateUser, deleteUser, gdprErase } from '../controllers/user.controller';
import { getUserDashboard } from '../controllers/user-dashboard.controller';
import { protect } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(protect);

router.get('/dashboard', getUserDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateUser);
router.delete('/profile', deleteUser);
router.post('/gdpr/erase', gdprErase);

export default router;
