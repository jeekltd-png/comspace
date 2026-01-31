import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  googleAuth,
  googleAuthCallback,
  getCurrentUser,
  updateProfile,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rate-limit.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);

export default router;
