import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';
import User from '../models/user.model';
import VendorProfile from '../models/vendor-profile.model';
import WhiteLabel from '../models/white-label.model';
import LoginHistory from '../models/loginHistory.model';
import { CustomError } from '../middleware/error.middleware';
import {
  generateToken,
  generateRefreshToken,
  AuthRequest,
} from '../middleware/auth.middleware';
import { sendEmail } from '../utils/email';
import { welcomeEmail } from '../templates/email.templates';
import { parseUserAgent, getClientIp } from '../utils/device-parser';
import { logger } from '../utils/logger';
import passport from 'passport';
import { redisClient } from '../server';
import jwt from 'jsonwebtoken';

export const register: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { email, password, firstName, lastName, phone, accountType, organization, spacePreset } = req.body;

    // ── Space-preset feature-flag map ──────────────────────────────────────
    // Vertical shortcuts (salon, food-store, etc.) register as accountType=business
    // with a spacePreset hint. This map defines the feature flags each preset enables.
    const SPACE_PRESET_FEATURES: Record<string, Record<string, boolean>> = {
      salon: {
        products: true, pricing: true, cart: true, checkout: true,
        delivery: false, pickup: false, reviews: true, wishlist: true,
        chat: true, socialLogin: true, booking: true, salon: true,
      },
      'food-store': {
        products: true, pricing: true, cart: true, checkout: true,
        delivery: true, pickup: true, reviews: true, wishlist: true,
        chat: false, socialLogin: true, booking: false, salon: false,
      },
      restaurant: {
        products: true, pricing: true, cart: true, checkout: true,
        delivery: true, pickup: true, reviews: true, wishlist: false,
        chat: false, socialLogin: true, booking: true, salon: false,
      },
      gym: {
        products: true, pricing: true, cart: true, checkout: true,
        delivery: false, pickup: false, reviews: true, wishlist: false,
        chat: true, socialLogin: true, booking: true, salon: false,
      },
      pharmacy: {
        products: true, pricing: true, cart: true, checkout: true,
        delivery: true, pickup: true, reviews: true, wishlist: true,
        chat: false, socialLogin: true, booking: false, salon: false,
      },
      laundry: {
        products: true, pricing: true, cart: true, checkout: true,
        delivery: true, pickup: true, reviews: true, wishlist: false,
        chat: false, socialLogin: true, booking: true, salon: false,
      },
      'home-services': {
        products: true, pricing: true, cart: false, checkout: false,
        delivery: false, pickup: false, reviews: true, wishlist: false,
        chat: true, socialLogin: true, booking: true, salon: false,
      },
      healthcare: {
        products: false, pricing: true, cart: false, checkout: false,
        delivery: false, pickup: false, reviews: true, wishlist: false,
        chat: true, socialLogin: true, booking: true, salon: false,
        healthcare: true,
      },
      worship: {
        products: false, pricing: true, cart: false, checkout: false,
        delivery: false, pickup: false, reviews: true, wishlist: false,
        chat: true, socialLogin: true, booking: true, salon: false,
        worship: true,
      },
    };

    // Validate accountType-specific fields
    const acctType = accountType || 'individual';
    if (!['individual', 'business', 'association', 'education'].includes(acctType)) {
      return next(new CustomError('Invalid account type', 400));
    }
    if ((acctType === 'business' || acctType === 'association' || acctType === 'education') && (!organization || !organization.name)) {
      return next(new CustomError('Organization / institution name is required for business, association and education accounts', 400));
    }

    // Check if user exists
    const existingUser = await User.findOne({ email, tenant: authReq.tenant });
    if (existingUser) {
      return next(new CustomError('Registration could not be completed. Please try a different email or log in.', 400));
    }

    // Determine role based on account type
    let role: string = 'customer';
    let tenantId = authReq.tenant || 'default';

    // New: Support "sellOnMarketplace" flag — business/association user becomes a
    // merchant on the current tenant WITHOUT creating a separate white-label.
    const sellOnMarketplace = req.body.sellOnMarketplace === true;
    const showcaseOnly = req.body.showcaseOnly === true;

    if ((sellOnMarketplace || showcaseOnly) && (acctType === 'business' || acctType === 'association')) {
      // Stay on the current tenant, assign merchant role
      role = 'merchant';
    } else if (acctType === 'association' || acctType === 'business' || acctType === 'education') {
      // Create a new tenant (white-label) for this organization
      const slug = organization.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 40);
      const uniqueTenantId = `${slug}-${Date.now().toString(36)}`;

      await WhiteLabel.create({
        tenantId: uniqueTenantId,
        name: organization.name,
        domain: `${slug}.comspace.app`,
        branding: {
          logo: '/logo.svg',
          primaryColor: '#7C3AED',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
          fontFamily: 'Inter, sans-serif',
        },
        // If a spacePreset was provided (e.g. 'salon', 'food-store'), use its
        // feature flags. Otherwise fall back to the legacy accountType logic.
        features: spacePreset && SPACE_PRESET_FEATURES[spacePreset]
          ? SPACE_PRESET_FEATURES[spacePreset]
          : {
              delivery: acctType === 'business',
              pickup: acctType === 'business',
              reviews: acctType !== 'education',
              wishlist: acctType === 'business',
              chat: acctType === 'education',
              socialLogin: true,
              // Education-specific features
              ...(acctType === 'education' ? {
                timetable: true,
                enrollment: true,
                parentPortal: true,
                studentPortal: true,
              } : {}),
            },
        payment: {
          stripeAccountId: '',
          supportedMethods: ['card'],
          currencies: ['USD'],
        },
        contact: { email, phone: phone || '', address: '' },
        seo: {
          title: organization.name,
          description: `${organization.name} — powered by ComSpace`,
          keywords: [],
        },
        isActive: true,
      });

      tenantId = uniqueTenantId;
      role = (acctType === 'association' || acctType === 'education') ? 'admin' : 'merchant';
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      accountType: acctType,
      organization: (acctType !== 'individual' && organization) ? {
        name: organization.name,
        registrationNumber: organization.registrationNumber,
        taxId: organization.taxId,
        industry: organization.industry,
        mission: organization.mission,
        estimatedMembers: organization.estimatedMembers,
        // Education-specific fields
        institutionType: acctType === 'education' ? organization.institutionType : undefined,
        estimatedStudents: acctType === 'education' ? organization.estimatedStudents : undefined,
        urn: acctType === 'education' ? organization.urn : undefined,
      } : undefined,
      tenant: tenantId,
    });

    // Auto-create VendorProfile for showcase registrations
    if (showcaseOnly && organization?.name) {
      const slug = organization.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);
      try {
        await VendorProfile.create({
          userId: user._id,
          storeName: organization.name,
          slug: `${slug}-${Date.now().toString(36)}`,
          shortDescription: organization.industry
            ? organization.industry.charAt(0).toUpperCase() + organization.industry.slice(1)
            : 'Local business',
          profileType: 'showcase',
          isApproved: false,
          isActive: true,
          tenant: tenantId,
        });
      } catch (vpErr) {
        logger.warn('Auto-create vendor profile skipped:', { error: (vpErr as Error).message });
      }
    }

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
    }).catch(err => logger.warn('Email send failed:', { error: err.message }));

    // Send branded welcome email (non-blocking)
    const orgName = organization?.name;
    const welcome = welcomeEmail(
      `${firstName} ${lastName}`,
      undefined,
      acctType,
      orgName
    );
    sendEmail({
      to: user.email,
      subject: welcome.subject,
      html: welcome.html,
    }).catch(err => logger.warn('Welcome email send failed:', { error: err.message }));

    // Generate tokens
    const token = generateToken(user._id.toString(), authReq.tenant!);
    const refreshTokenVal = generateRefreshToken(user._id.toString(), authReq.tenant!);

    // Set tokens in HttpOnly cookies for security (prevents XSS token theft)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });
    res.cookie('refresh_token', refreshTokenVal, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth',
    });

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
          accountType: user.accountType,
        },
        token,
        refreshToken: refreshTokenVal,
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
      // Record failed login attempt (fire-and-forget)
      const failDevice = parseUserAgent(req.headers['user-agent']);
      LoginHistory.create({
        user: user?._id,
        email,
        action: 'login_failed',
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        device: failDevice,
        failureReason: !user ? 'user_not_found' : 'wrong_password',
        tenant: authReq.tenant || 'default',
      }).catch(() => {});
      return next(new CustomError('Invalid credentials', 401));
    }

    // Require email verification before login
    if (!user.isVerified) {
      return next(new CustomError('Please verify your email address before logging in', 403));
    }

    if (!user.isActive) {
      // Record disabled account login attempt
      LoginHistory.create({
        user: user._id,
        email,
        action: 'login_failed',
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        device: parseUserAgent(req.headers['user-agent']),
        failureReason: 'account_deactivated',
        tenant: authReq.tenant || 'default',
      }).catch(() => {});
      return next(new CustomError('Account is deactivated', 401));
    }

    // Update last login (use updateOne to avoid re-triggering the pre-save
    // password hash hook — the password field loaded via select('+password')
    // is considered "modified" by Mongoose, which would double-hash it).
    await User.updateOne({ _id: user._id }, { lastLogin: new Date() });

    // Generate tokens
    const token = generateToken(user._id.toString(), authReq.tenant!);
    const refreshTokenVal = generateRefreshToken(user._id.toString(), authReq.tenant!);

    // Record successful login (fire-and-forget)
    const device = parseUserAgent(req.headers['user-agent']);
    const clientIp = getClientIp(req);
    LoginHistory.create({
      user: user._id,
      email: user.email,
      action: 'login_success',
      ip: clientIp,
      userAgent: req.headers['user-agent'] || '',
      device,
      tenant: authReq.tenant || 'default',
    }).catch(() => {});

    // Set tokens in HttpOnly cookies for security (prevents XSS token theft)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });
    res.cookie('refresh_token', refreshTokenVal, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth',
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          accountType: user.accountType,
          avatar: user.avatar,
        },
        token,
        refreshToken: refreshTokenVal,
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

    // Clear HttpOnly cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });

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
    // Support both cookie-based and body-based refresh tokens
    const refreshTokenValue = req.cookies?.refresh_token || req.body?.refreshToken;

    if (!refreshTokenValue) {
      return next(new CustomError('Refresh token is required', 400));
    }
    // Alias for backward compatibility
    const refreshToken = refreshTokenValue;

    // Check if refresh token has been revoked
    if (redisClient && redisClient.get) {
      const revoked = await redisClient.get(`rt_revoked:${refreshToken}`);
      if (revoked) {
        return next(new CustomError('Refresh token has been revoked', 401));
      }
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      return next(new CustomError('Server configuration error', 500));
    }
    const decoded = jwt.verify(refreshToken, refreshSecret, { algorithms: ['HS256'] }) as {
      id: string;
      tenant: string;
    };

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new CustomError('Invalid refresh token', 401));
    }

    // Revoke old refresh token (token rotation)
    if (redisClient && redisClient.setEx) {
      // Revoke for the duration of the old token's max lifetime (7 days)
      await redisClient.setEx(`rt_revoked:${refreshToken}`, 7 * 24 * 3600, '1');
    }

    const newToken = generateToken(user._id.toString(), decoded.tenant);
    const newRefreshToken = generateRefreshToken(user._id.toString(), decoded.tenant);

    // Set updated tokens in HttpOnly cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', newToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

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

    // Always return a generic success message to prevent user enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
      return;
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

    // Record password reset request (fire-and-forget)
    LoginHistory.create({
      user: user._id,
      email: user.email,
      action: 'password_reset_request',
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      device: parseUserAgent(req.headers['user-agent']),
      tenant: authReq.tenant || 'default',
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
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

    // Record password reset completion (fire-and-forget)
    LoginHistory.create({
      user: user._id,
      email: user.email,
      action: 'password_reset_complete',
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      device: parseUserAgent(req.headers['user-agent']),
      tenant: user.tenant || 'default',
    }).catch(() => {});

    // Send confirmation email
    sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully',
      text: `Your password has been changed successfully. If you did not make this change, contact support immediately.`,
    }).catch(() => {});

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
  passport.authenticate('google', { session: false }, async (err: Error, user: any) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // Generate a short-lived auth code instead of passing tokens in URL
    const authCode = crypto.randomBytes(32).toString('hex');
    const token = generateToken(user._id.toString(), user.tenant);
    const refreshToken = generateRefreshToken(user._id.toString(), user.tenant);

    // Store tokens in Redis under the auth code (expires in 60 seconds)
    if (redisClient && redisClient.setEx) {
      await redisClient.setEx(
        `authcode:${authCode}`,
        60,
        JSON.stringify({ token, refreshToken })
      );
    }

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?code=${authCode}`
    );
  })(req, res, next);
};

// Exchange auth code for tokens (called by frontend)
export const exchangeAuthCode: RequestHandler = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return next(new CustomError('Auth code is required', 400));
    }

    let tokensJson: string | null = null;
    if (redisClient && redisClient.get) {
      tokensJson = await redisClient.get(`authcode:${code}`);
    }

    if (!tokensJson) {
      return next(new CustomError('Invalid or expired auth code', 400));
    }

    // Delete the code so it can't be reused
    if (redisClient && redisClient.del) {
      await redisClient.del(`authcode:${code}`);
    }

    const tokens = JSON.parse(tokensJson);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
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
