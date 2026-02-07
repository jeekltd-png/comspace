import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  getPaymentMethods,
} from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validate, createPaymentIntentValidation } from '../middleware/validate.middleware';

const router = Router();

router.post('/webhook', handleStripeWebhook);

router.use(tenantMiddleware);
router.use(protect);

router.post('/intent', validate(createPaymentIntentValidation), createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/methods', getPaymentMethods);

export default router;
