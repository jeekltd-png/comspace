import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
} from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validate, createPaymentIntentValidation } from '../middleware/validate.middleware';

const router = Router();

// Webhook is mounted directly in server.ts with express.raw() BEFORE express.json()
// to ensure Stripe signature verification works correctly.

router.use(tenantMiddleware);
router.use(protect);

router.post('/intent', validate(createPaymentIntentValidation), createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/methods', getPaymentMethods);

export default router;
