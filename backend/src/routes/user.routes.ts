import { Router } from 'express';
import { getProfile, updateUser, deleteUser } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateUser);
router.delete('/profile', deleteUser);

export default router;
