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

const router = Router();

router.use(tenantMiddleware);

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/:id', getProduct);

router.use(protect);
// Allow admin-like roles (including superadmin and seeded admin1/admin2) and merchants
router.use(authorize('admin', 'merchant', 'superadmin', 'admin1', 'admin2'));

router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
