import { Router } from 'express';
import { subscribe, unsubscribe } from '../controllers/newsletter.controller';
import { newsletterLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// Subscribe to newsletter
router.post('/subscribe', newsletterLimiter, subscribe);

// Unsubscribe from newsletter
router.post('/unsubscribe', newsletterLimiter, unsubscribe);

export default router;
