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
    // await redisClient.setEx(`verify:${verificationToken}`, 86400, user._id.toString());

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      text: `Please click this link to verify your email: ${verificationUrl}`,
    });

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

export const logout: RequestHandler = async (_req, res, next) => {
  try {
    // In a real application, you might want to blacklist the token
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
    // await redisClient.setEx(`reset:${resetToken}`, 3600, user._id.toString());

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
    // const userId = await redisClient.get(`reset:${token}`);

    // For now, decode from token (in production, use Redis)
    const userId = token; // Placeholder

    const user = await User.findById(userId);

    if (!user) {
      return next(new CustomError('Invalid or expired reset token', 400));
    }

    user.password = password;
    await user.save();

    // Delete reset token from Redis
    // await redisClient.del(`reset:${token}`);

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
    // const userId = await redisClient.get(`verify:${token}`);

    // For now, placeholder
    const userId = token;

    const user = await User.findById(userId);

    if (!user) {
      return next(new CustomError('Invalid or expired verification token', 400));
    }

    user.isVerified = true;
    await user.save();

    // Delete verification token
    // await redisClient.del(`verify:${token}`);

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
    const { firstName, lastName, phone, avatar, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      authReq.user!._id,
      {
        firstName,
        lastName,
        phone,
        avatar,
        preferences,
      },
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
