import { Router } from 'express';
import { discover, getDiscoverCategories } from '../controllers/discovery.controller';

const router = Router();

// ── Public — no auth required ──────────────────────────────
// These endpoints are platform-wide (cross-tenant), not tenant-scoped.

router.get('/', discover);
router.get('/categories', getDiscoverCategories);

export default router;
