/**
 * Tenant Management Routes — superadmin only
 *
 * All routes require authentication + superadmin role.
 * Mounted at /api/admin/tenants in server.ts
 */

import { Router } from 'express';
import {
  listTenants,
  getTenantDetail,
  createTenant,
  updateTenant,
  toggleTenant,
  getCrossTenantStats,
  getTenantUsers,
  getTenantDashboard,
} from '../controllers/tenant.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// All routes require authentication + superadmin role
router.use(tenantMiddleware);
router.use(protect);
router.use(authorize('superadmin'));

// Aggregate stats across all tenants
router.get('/stats/overview', getCrossTenantStats);

// CRUD
router.get('/', listTenants);
router.post('/', createTenant);
router.get('/:tenantId', getTenantDetail);
router.put('/:tenantId', updateTenant);
router.patch('/:tenantId/toggle', toggleTenant);

// Per-tenant resources
router.get('/:tenantId/users', getTenantUsers);
router.get('/:tenantId/dashboard', getTenantDashboard);

export default router;
