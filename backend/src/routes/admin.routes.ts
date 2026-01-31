import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  getOrdersList,
  getProductsList,
  generateSalesReport,
  generateInventoryReport,
} from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);
router.use(protect);
router.use(authorize('admin', 'merchant'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/orders', getOrdersList);
router.get('/products', getProductsList);
router.get('/reports/sales', generateSalesReport);
router.get('/reports/inventory', generateInventoryReport);

export default router;
