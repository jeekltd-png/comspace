import { Router } from 'express';
import { subscribe, unsubscribe } from '../controllers/newsletter.controller';

const router = Router();

// Subscribe to newsletter
router.post('/subscribe', subscribe);

// Unsubscribe from newsletter
router.post('/unsubscribe', unsubscribe);

export default router;
