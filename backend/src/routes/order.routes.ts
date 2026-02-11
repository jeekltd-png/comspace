import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/order.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireFeature } from '../middleware/feature-gate.middleware';
import { checkoutLimiter } from '../middleware/rate-limit.middleware';
import {
  validate,
  createOrderValidation,
  updateOrderStatusValidation,
  mongoIdParam,
} from '../middleware/validate.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(protect);
router.use(requireFeature('cart', 'checkout'));

router.post('/', checkoutLimiter, validate(createOrderValidation), createOrder);
router.get('/', getOrders);
router.get('/:id', validate(mongoIdParam()), getOrder);
router.patch('/:id/status', authorize('admin', 'merchant'), validate(updateOrderStatusValidation), updateOrderStatus);
router.post('/:id/cancel', validate(mongoIdParam()), cancelOrder);

export default router;
