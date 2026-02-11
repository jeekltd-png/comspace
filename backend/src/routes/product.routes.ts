import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from '../controllers/product.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requireFeature } from '../middleware/feature-gate.middleware';
import {
  validate,
  createProductValidation,
  updateProductValidation,
  mongoIdParam,
} from '../middleware/validate.middleware';

const router = Router();

router.use(tenantMiddleware);

// Public product browsing — gated by 'products' feature
router.get('/', requireFeature('products'), getProducts);
router.get('/search', requireFeature('products'), searchProducts);
router.get('/:id', requireFeature('products'), validate(mongoIdParam()), getProduct);

router.use(protect);
// Allow admin-like roles (including superadmin and seeded admin1/admin2) and merchants
router.use(authorize('admin', 'merchant', 'superadmin', 'admin1', 'admin2'));

router.post('/', validate(createProductValidation), createProduct);
router.put('/:id', validate(updateProductValidation), updateProduct);
router.delete('/:id', validate(mongoIdParam()), deleteProduct);

export default router;
