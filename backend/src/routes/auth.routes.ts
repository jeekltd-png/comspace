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
  changePassword,
} from '../controllers/auth.controller';

// Protected change password route added below
import { protect } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rate-limit.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import {
  validate,
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
} from '../middleware/validate.middleware';

const router = Router();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Public routes
router.post('/register', authLimiter, validate(registerValidation), register);
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/refresh-token', validate(refreshTokenValidation), refreshToken);
router.post('/forgot-password', authLimiter, validate(forgotPasswordValidation), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordValidation), resetPassword);
router.get('/verify-email/:token', verifyEmail);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getCurrentUser);
router.put('/profile', validate(updateProfileValidation), updateProfile);
router.post('/change-password', validate(changePasswordValidation), changePassword);

export default router;
