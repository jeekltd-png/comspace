import { Router } from 'express';
import { detectLocation, getNearbyStores, validateAddress } from '../controllers/location.controller';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);

router.post('/detect', detectLocation);
router.get('/stores/nearby', getNearbyStores);
router.post('/validate-address', validateAddress);

export default router;
