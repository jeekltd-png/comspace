import { Router } from 'express';
import { sendMessage, getHistory, closeConversation } from '../controllers/chat.controller';
import { protect } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit chat to prevent abuse — 30 messages per 5 minutes per IP
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: 'Too many messages. Please wait a moment before sending more.',
  standardHeaders: true,
  legacyHeaders: false,
});

// All chat routes use tenant middleware (inherited from server.ts prefix)
// Authentication is optional — guests can chat, auth users get personalised answers

/**
 * POST /api/chat/message
 * Body: { message: string, sessionId?: string, locale?: string, pageUrl?: string }
 */
router.post('/message', chatLimiter, sendMessage);

/**
 * GET /api/chat/history?sessionId=xxx
 */
router.get('/history', getHistory);

/**
 * POST /api/chat/close
 * Body: { sessionId: string }
 */
router.post('/close', closeConversation);

/**
 * GET /api/chat/history/mine  — authenticated user's conversation history
 */
router.get('/history/mine', protect, getHistory);

export default router;
