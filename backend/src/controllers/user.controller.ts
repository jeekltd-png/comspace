import { RequestHandler } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/user.model';
import Order from '../models/order.model';
import Cart from '../models/cart.model';
import Review from '../models/Review';
import LoginHistory from '../models/loginHistory.model';
import { redisClient } from '../server';

export const getProfile: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const user = await User.findById(authReq.user!._id);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

export const updateUser: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    // Whitelist allowed fields to prevent privilege escalation
    const allowedFields = ['firstName', 'lastName', 'phone', 'avatar', 'addresses', 'preferences'];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(authReq.user!._id, updates, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    await User.findByIdAndUpdate(authReq.user!._id, { isActive: false });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/gdpr/erase
 * GDPR Article 17 — Right to Erasure (self-service)
 *
 * Anonymises all PII tied to the requesting user while preserving
 * order records (financial/legal retention obligation).
 * Completed orders have personal data anonymised in-line.
 */
export const gdprErase: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!._id;

    // Anonymise the user record — replace PII with opaque tokens
    const token = crypto.randomBytes(8).toString('hex');
    await User.findByIdAndUpdate(userId, {
      email: `deleted-${token}@erased.invalid`,
      firstName: 'Deleted',
      lastName: 'User',
      phone: undefined,
      avatar: undefined,
      addresses: [],
      oauth: {},
      isActive: false,
      isVerified: false,
    });

    // Anonymise review author names (retain review ratings for product quality signals)
    await Review.updateMany({ userId }, { userId: null, author: 'Deleted User' });

    // Delete cart — no legal retention requirement
    await Cart.deleteMany({ user: userId });

    // Anonymise orders — keep for financial records, scrub delivery PII
    await Order.updateMany(
      { user: userId },
      {
        $unset: { deliveryAddress: '', notes: '' },
        $set: { 'items.$[].name': '[removed]' },
      }
    );

    // Delete login history — no legitimate purpose after erasure
    await LoginHistory.deleteMany({ user: userId });

    // Blacklist any active tokens so the session ends immediately
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer')) {
      const bearerToken = authHeader.split(' ')[1];
      if (redisClient?.setEx) {
        // Blacklist for up to 24 hours (covers max access token lifetime)
        await redisClient.setEx(`bl:${bearerToken}`, 86400, '1');
      }
    }
    if (redisClient?.del) {
      // Clear any refresh tokens keyed by user (pattern: rt_revoked is per-token, not per-user)
      // Clearing refresh cookies is sufficient since the user record is now deactivated
    }

    // Clear HttpOnly auth cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });

    res.status(200).json({
      success: true,
      message: 'Your personal data has been erased in accordance with GDPR Article 17.',
    });
  } catch (error) {
    next(error);
  }
};
