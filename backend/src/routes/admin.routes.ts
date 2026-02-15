import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  getOrdersList,
  getProductsList,
  generateSalesReport,
  generateInventoryReport,
} from '../controllers/admin.controller';
import {
  listUsers,
  getUserDetail,
  toggleUserStatus,
  changeUserRole,
  adminResetPassword,
  forceVerifyUser,
  getAuditLogs,
  getLoginHistory,
} from '../controllers/user-management.controller';
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

// ── User Management (admin+ only) ─────────────────────────────────────────
router.get('/users/manage', authorize('superadmin', 'admin', 'admin1', 'admin2'), listUsers);
router.get('/users/manage/:id', authorize('superadmin', 'admin', 'admin1', 'admin2'), getUserDetail);
router.patch('/users/manage/:id/status', authorize('superadmin', 'admin', 'admin1'), toggleUserStatus);
router.patch('/users/manage/:id/role', authorize('superadmin', 'admin'), changeUserRole);
router.post('/users/manage/:id/reset-password', authorize('superadmin', 'admin', 'admin1'), adminResetPassword);
router.patch('/users/manage/:id/verify', authorize('superadmin', 'admin', 'admin1'), forceVerifyUser);

// ── Audit & Security Logs ──────────────────────────────────────────────────
router.get('/audit-logs', authorize('superadmin', 'admin', 'admin1'), getAuditLogs);
router.get('/login-history', authorize('superadmin', 'admin', 'admin1'), getLoginHistory);

// Admin docs (accessible to tiered admins and superadmins)
import { listAdminDocs, getAdminDoc } from '../controllers/admin-docs.controller';
router.get('/docs', authorize('superadmin', 'admin', 'admin1', 'admin2'), listAdminDocs);
router.get('/docs/:name', authorize('superadmin', 'admin', 'admin1', 'admin2'), getAdminDoc);

export default router;
