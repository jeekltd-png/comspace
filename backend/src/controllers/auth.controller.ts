import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';
import User from '../models/user.model';
import { CustomError } from '../middleware/error.middleware';
import {
  generateToken,
  generateRefreshToken,
  AuthRequest,
} from '../middleware/auth.middleware';
import { sendEmail } from '../utils/email';
import passport from 'passport';
import { redisClient } from '../server';
import jwt from 'jsonwebtoken';

export const register: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email, tenant: authReq.tenant });
    if (existingUser) {
      return next(new CustomError('User already exists with this email', 400));
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      tenant: authReq.tenant,
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // Store token in Redis with 24h expiry
    if (redisClient && redisClient.setEx) {
      await redisClient.setEx(`verify:${verificationToken}`, 86400, user._id.toString());
    }

    // Send verification email (non-blocking)
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      text: `Please click this link to verify your email: ${verificationUrl}`,
    }).catch(err => console.log('Email send failed:', err.message));

    // Generate tokens
    const token = generateToken(user._id.toString(), authReq.tenant!);
    const refreshToken = generateRefreshToken(user._id.toString(), authReq.tenant!);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new CustomError('Please provide email and password', 400));
    }

    // Find user
    const user = await User.findOne({ email, tenant: authReq.tenant }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new CustomError('Invalid credentials', 401));
    }

    if (!user.isActive) {
      return next(new CustomError('Account is deactivated', 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user._id.toString(), authReq.tenant!);
    const refreshToken = generateRefreshToken(user._id.toString(), authReq.tenant!);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    // Blacklist the current token so it can't be reused
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(token) as { exp?: number } | null;
        if (decoded?.exp && redisClient) {
          // Store in blacklist until the token's natural expiry
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await redisClient.setEx(`bl:${token}`, ttl, '1');
          }
        }
      } catch (_) {
        // If decode fails, still proceed with logout
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new CustomError('Refresh token is required', 400));
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      id: string;
      tenant: string;
    };

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new CustomError('Invalid refresh token', 401));
    }

    const newToken = generateToken(user._id.toString(), decoded.tenant);
    const newRefreshToken = generateRefreshToken(user._id.toString(), decoded.tenant);

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return next(new CustomError('Invalid refresh token', 401));
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, tenant: authReq.tenant });

    if (!user) {
      return next(new CustomError('No user found with this email', 404));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Store in Redis with 1h expiry
    if (redisClient && redisClient.setEx) {
      await redisClient.setEx(`reset:${resetToken}`, 3600, user._id.toString());
    }

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `Click this link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Get userId from Redis
    let userId: string | null = null;
    if (redisClient && redisClient.get) {
      userId = await redisClient.get(`reset:${token}`);
    }

    if (!userId) {
      return next(new CustomError('Invalid or expired reset token', 400));
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(new CustomError('Invalid or expired reset token', 400));
    }

    user.password = password;
    await user.save();

    // Delete reset token from Redis
    if (redisClient && redisClient.del) {
      await redisClient.del(`reset:${token}`);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    // Get userId from Redis
    let userId: string | null = null;
    if (redisClient && redisClient.get) {
      userId = await redisClient.get(`verify:${token}`);
    }

    if (!userId) {
      return next(new CustomError('Invalid or expired verification token', 400));
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(new CustomError('Invalid or expired verification token', 400));
    }

    user.isVerified = true;
    await user.save();

    // Delete verification token
    if (redisClient && redisClient.del) {
      await redisClient.del(`verify:${token}`);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

export const googleAuthCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, (err: Error, user: any) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    const token = generateToken(user._id.toString(), user.tenant);
    const refreshToken = generateRefreshToken(user._id.toString(), user.tenant);

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`
    );
  })(req, res, next);
};

export const getCurrentUser: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const user = await User.findById(authReq.user!._id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    // allow updating common profile fields including addresses
    const { firstName, lastName, phone, avatar, preferences, addresses } = req.body;

    const update: any = { firstName, lastName, phone, avatar, preferences };
    if (addresses) update.addresses = addresses;

    const user = await User.findByIdAndUpdate(
      authReq.user!._id,
      update,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new CustomError('currentPassword and newPassword required', 400));
    }

    const user = await User.findById(authReq.user!._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return next(new CustomError('Current password incorrect', 401));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed' });
  } catch (error) {
    next(error);
  }
};
