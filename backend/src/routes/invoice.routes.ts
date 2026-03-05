import { Router } from 'express';
import {
  getMyInvoices,
  getInvoice,
  downloadInvoice,
  verifyInvoice,
  generateInvoiceForOrder,
  getAllInvoices,
} from '../controllers/invoice.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);

// ── Public: QR code verification (no auth needed) ──
router.get('/verify/:token', verifyInvoice);

// ── Protected: User invoices ──
router.get('/', protect, getMyInvoices);
router.get('/:id', protect, getInvoice);
router.get('/:id/download', protect, downloadInvoice);

// ── Admin: invoice management ──
router.get(
  '/admin/all',
  protect,
  authorize('superadmin', 'admin', 'admin1', 'admin2', 'merchant'),
  getAllInvoices
);
router.post(
  '/generate/:orderId',
  protect,
  authorize('superadmin', 'admin', 'admin1', 'admin2'),
  generateInvoiceForOrder
);

export default router;
