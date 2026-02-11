import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cart.controller';
import { protect } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireFeature } from '../middleware/feature-gate.middleware';
import {
  validate,
  addToCartValidation,
  updateCartItemValidation,
  mongoIdParam,
} from '../middleware/validate.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(protect);
router.use(requireFeature('cart'));

router.get('/', getCart);
router.post('/items', validate(addToCartValidation), addToCart);
router.put('/items/:productId', validate(updateCartItemValidation), updateCartItem);
router.delete('/items/:productId', validate(mongoIdParam('productId')), removeFromCart);
router.delete('/', clearCart);

export default router;
