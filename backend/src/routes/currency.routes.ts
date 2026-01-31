import { Router } from 'express';
import { getExchangeRates, convertCurrency } from '../controllers/currency.controller';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);

router.get('/rates', getExchangeRates);
router.post('/convert', convertCurrency);

export default router;
