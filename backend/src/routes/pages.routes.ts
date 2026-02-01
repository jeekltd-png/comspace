import { Router } from 'express';
import { getPage, listPages, createPage, updatePage, deletePage } from '../controllers/page.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);

// public: get page by slug
router.get('/:slug', getPage);

// admin routes
router.use(protect);
router.use(authorize('superadmin','admin','admin1','admin2'));
router.get('/', listPages);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

export default router;
