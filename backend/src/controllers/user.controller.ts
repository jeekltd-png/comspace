import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/user.model';
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
