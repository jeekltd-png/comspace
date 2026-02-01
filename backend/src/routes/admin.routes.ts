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
// Allow global and tiered admins and merchants to access the admin area
router.use(authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/orders', getOrdersList);
router.get('/products', getProductsList);
router.get('/reports/sales', generateSalesReport);
router.get('/reports/inventory', generateInventoryReport);

// Admin docs (accessible to tiered admins and superadmins)
import { listAdminDocs, getAdminDoc } from '../controllers/admin-docs.controller';
router.get('/docs', authorize('superadmin', 'admin', 'admin1', 'admin2'), listAdminDocs);
router.get('/docs/:name', authorize('superadmin', 'admin', 'admin1', 'admin2'), getAdminDoc);

export default router;
