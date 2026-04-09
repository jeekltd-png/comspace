import { RequestHandler } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/user.model';
import AuditLog from '../models/auditLog.model';
import LoginHistory from '../models/loginHistory.model';
import { CustomError } from '../middleware/error.middleware';
import { createAuditLog } from '../utils/audit';
import { sendEmail } from '../utils/email';
import { redisClient } from '../server';

// Role hierarchy for authorization checks
const ROLE_HIERARCHY: Record<string, number> = {
  customer: 0,
  merchant: 1,
  admin2: 2,
  admin1: 3,
  admin: 4,
  superadmin: 5,
};

/**
 * GET /api/admin/users/manage - List users with search, filters, pagination
 */
export const listUsers: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status, // active, inactive, unverified
      accountType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query: any = { tenant: authReq.tenant };

    // Search by name or email
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by role
    if (role) query.role = role;

    // Filter by account type
    if (accountType) query.accountType = accountType;

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
      query.isVerified = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'unverified') {
      query.isVerified = false;
    }

    const skip = (Number(page) - 1) * Math.min(Number(limit), 100);
    const sortObj: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sortObj)
        .skip(skip)
        .limit(Math.min(Number(limit), 100)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Math.min(Number(limit), 100),
          total,
          pages: Math.ceil(total / Math.min(Number(limit), 100)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/manage/:id - Get single user detail
 */
export const getUserDetail: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenant: authReq.tenant,
    }).select('-password');

    if (!user) {
      return next(new CustomError('User not found', 404));
    }

    // Get recent login history
    const loginHistory = await LoginHistory.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get recent audit trail for this user
    const auditTrail = await AuditLog.find({
      $or: [
        { targetId: user._id.toString() },
        { actor: user._id },
      ],
      tenant: authReq.tenant,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        user,
        loginHistory,
        auditTrail,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/manage/:id/status - Enable/disable user account
 */
export const toggleUserStatus: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return next(new CustomError('isActive must be a boolean', 400));
    }

    const user = await User.findOne({
      _id: req.params.id,
      tenant: authReq.tenant,
    });

    if (!user) {
      return next(new CustomError('User not found', 404));
    }

    // Prevent disabling yourself
    if (user._id.toString() === authReq.user!._id.toString()) {
      return next(new CustomError('Cannot disable your own account', 400));
    }

    // Prevent lower-ranked admin from modifying higher-ranked
    const actorLevel = ROLE_HIERARCHY[authReq.user!.role] || 0;
    const targetLevel = ROLE_HIERARCHY[user.role] || 0;
    if (targetLevel >= actorLevel) {
      return next(new CustomError('Insufficient permissions to modify this user', 403));
    }

    const oldStatus = user.isActive;
    user.isActive = isActive;
    await user.save();

    // Audit log
    await createAuditLog({
      actor: authReq.user!,
      action: isActive ? 'user_enabled' : 'user_disabled',
      category: 'user_management',
      description: `${isActive ? 'Enabled' : 'Disabled'} user account: ${user.email}`,
      targetType: 'user',
      targetId: user._id.toString(),
      targetEmail: user.email,
      changes: [{ field: 'isActive', oldValue: oldStatus, newValue: isActive }],
      req,
      tenant: authReq.tenant,
    });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
      data: { user: { id: user._id, email: user.email, isActive: user.isActive } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/manage/:id/role - Change user role
 */
export const changeUserRole: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { role } = req.body;
    const validRoles = ['customer', 'merchant', 'admin2', 'admin1', 'admin'];

    // Only superadmin can promote to admin level
    if (authReq.user!.role !== 'superadmin') {
      // Non-superadmin can only assign roles below their own level
      const actorLevel = ROLE_HIERARCHY[authReq.user!.role] || 0;
      const newRoleLevel = ROLE_HIERARCHY[role] || 0;
      if (newRoleLevel >= actorLevel) {
        return next(new CustomError('Cannot assign a role equal to or higher than your own', 403));
      }
    }

    if (!validRoles.includes(role) && authReq.user!.role !== 'superadmin') {
      return next(new CustomError('Invalid role', 400));
    }

    // Superadmin can assign any role including superadmin
    if (authReq.user!.role === 'superadmin' && !['customer', 'merchant', 'admin2', 'admin1', 'admin', 'superadmin'].includes(role)) {
      return next(new CustomError('Invalid role', 400));
    }

    const user = await User.findOne({
      _id: req.params.id,
      tenant: authReq.tenant,
    });

    if (!user) {
      return next(new CustomError('User not found', 404));
    }

    // Prevent changing your own role
    if (user._id.toString() === authReq.user!._id.toString()) {
      return next(new CustomError('Cannot change your own role', 400));
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Audit log
    await createAuditLog({
      actor: authReq.user!,
      action: 'user_role_changed',
      category: 'user_management',
      description: `Changed role for ${user.email}: ${oldRole} → ${role}`,
      targetType: 'user',
      targetId: user._id.toString(),
      targetEmail: user.email,
      changes: [{ field: 'role', oldValue: oldRole, newValue: role }],
      req,
      tenant: authReq.tenant,
    });

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
      data: { user: { id: user._id, email: user.email, role: user.role } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users/manage/:id/reset-password - Admin-initiated password reset
 */
export const adminResetPassword: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenant: authReq.tenant,
    });

    if (!user) {
      return next(new CustomError('User not found', 404));
    }

    // Prevent reset on higher-ranked users
    const actorLevel = ROLE_HIERARCHY[authReq.user!.role] || 0;
    const targetLevel = ROLE_HIERARCHY[user.role] || 0;
    if (targetLevel >= actorLevel && authReq.user!._id.toString() !== user._id.toString()) {
      return next(new CustomError('Insufficient permissions', 403));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    if (redisClient && redisClient.setEx) {
      await redisClient.setEx(`reset:${resetToken}`, 3600, user._id.toString());
    }

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - Admin Initiated',
      text: `An administrator has initiated a password reset for your account.\n\nClick this link to set a new password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please contact support immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Password Reset</h2>
          <p>An administrator has initiated a password reset for your account.</p>
          <p><a href="${resetUrl}" style="background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
          <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
          <p style="color: #999; font-size: 12px;">If you did not request this, please contact support immediately.</p>
        </div>
      `,
    });

    // Audit log
    await createAuditLog({
      actor: authReq.user!,
      action: 'admin_password_reset',
      category: 'user_management',
      description: `Admin initiated password reset for ${user.email}`,
      targetType: 'user',
      targetId: user._id.toString(),
      targetEmail: user.email,
      req,
      tenant: authReq.tenant,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent to user',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/manage/:id/verify - Force verify user email
 */
export const forceVerifyUser: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenant: authReq.tenant,
    });

    if (!user) {
      return next(new CustomError('User not found', 404));
    }

    const oldVerified = user.isVerified;
    user.isVerified = true;
    await user.save();

    // Audit log
    await createAuditLog({
      actor: authReq.user!,
      action: 'user_force_verified',
      category: 'user_management',
      description: `Admin force-verified email for ${user.email}`,
      targetType: 'user',
      targetId: user._id.toString(),
      targetEmail: user.email,
      changes: [{ field: 'isVerified', oldValue: oldVerified, newValue: true }],
      req,
      tenant: authReq.tenant,
    });

    res.status(200).json({
      success: true,
      message: 'User email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit-logs - Get audit logs with filters
 */
export const getAuditLogs: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const {
      page = 1,
      limit = 50,
      category,
      action,
      actorId,
      targetType,
      targetId,
      status,
      startDate,
      endDate,
    } = req.query;

    const query: any = {};

    // Superadmin can view all tenants; others see only their tenant
    if (authReq.user!.role === 'superadmin' && req.query.tenantId) {
      query.tenant = req.query.tenantId;
    } else {
      query.tenant = authReq.tenant;
    }

    if (category) query.category = category;
    if (action) query.action = action;
    if (actorId) query.actor = actorId;
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Math.min(Number(limit), 100);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(Number(limit), 100)),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Math.min(Number(limit), 100),
          total,
          pages: Math.ceil(total / Math.min(Number(limit), 100)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/login-history - Get login history with filters
 */
export const getLoginHistory: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      startDate,
      endDate,
    } = req.query;

    const query: any = { tenant: authReq.tenant };

    if (userId) query.user = userId;
    if (action) query.action = action;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Math.min(Number(limit), 100);

    const [entries, total, failedCount, successCount] = await Promise.all([
      LoginHistory.find(query)
        .populate('user', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(Number(limit), 100)),
      LoginHistory.countDocuments(query),
      LoginHistory.countDocuments({ ...query, action: 'login_failed' }),
      LoginHistory.countDocuments({ ...query, action: 'login_success' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        entries,
        stats: {
          totalFailed: failedCount,
          totalSuccess: successCount,
        },
        pagination: {
          page: Number(page),
          limit: Math.min(Number(limit), 100),
          total,
          pages: Math.ceil(total / Math.min(Number(limit), 100)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users/manage - Create a new user (admin-initiated)
 * superadmin can create any role including admin; admin can create up to admin1/admin2/merchant/customer
 */
export const createUser: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { email, firstName, lastName, phone, role = 'customer', accountType = 'individual', password, sendWelcomeEmail = true } = req.body;

    if (!email || !firstName || !lastName) {
      return next(new CustomError('email, firstName and lastName are required', 400));
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new CustomError('Invalid email address', 400));
    }

    const validRoles = ['customer', 'merchant', 'admin2', 'admin1', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
      return next(new CustomError('Invalid role', 400));
    }

    // Role hierarchy enforcement
    const actorLevel = ROLE_HIERARCHY[authReq.user!.role] || 0;
    const newRoleLevel = ROLE_HIERARCHY[role] || 0;
    if (authReq.user!.role !== 'superadmin' && newRoleLevel >= actorLevel) {
      return next(new CustomError('Cannot assign a role equal to or higher than your own', 403));
    }

    // Check if email already exists for this tenant
    const existing = await User.findOne({ email: email.toLowerCase().trim(), tenant: authReq.tenant });
    if (existing) {
      return next(new CustomError('A user with this email already exists', 409));
    }

    // Generate a secure temporary password if not provided
    const tempPassword = password || (crypto.randomBytes(12).toString('base64').slice(0, 14) + '!A1');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await User.create({
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim(),
      role,
      accountType,
      password: hashedPassword,
      tenant: authReq.tenant,
      isVerified: true, // Admin-created users are pre-verified
      isActive: true,
    });

    // Send welcome email with credentials
    if (sendWelcomeEmail) {
      const loginUrl = `${process.env.FRONTEND_URL}/auth/login`;
      await sendEmail({
        to: user.email,
        subject: 'Your ComSpace Account Has Been Created',
        text: `Hello ${user.firstName},\n\nAn administrator has created an account for you.\n\nEmail: ${user.email}\n${!password ? `Temporary Password: ${tempPassword}\n` : ''}Please log in and change your password: ${loginUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7C3AED;">Welcome to ComSpace</h2>
            <p>Hello <strong>${user.firstName}</strong>,</p>
            <p>An administrator has created an account for you.</p>
            <table style="border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 4px 12px 4px 0; color: #666;">Email:</td><td><strong>${user.email}</strong></td></tr>
              ${!password ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Temp Password:</td><td><strong>${tempPassword}</strong></td></tr>` : ''}
              <tr><td style="padding: 4px 12px 4px 0; color: #666;">Role:</td><td><strong>${role}</strong></td></tr>
            </table>
            <p><a href="${loginUrl}" style="background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Log In Now</a></p>
            <p style="color: #e53e3e; font-size: 14px;">&#x26A0;&#xFE0F; Please change your password after first login.</p>
          </div>
        `,
      }).catch(() => {/* Email failure is non-fatal */});
    }

    await createAuditLog({
      actor: authReq.user!,
      action: 'user_created',
      category: 'user_management',
      description: `Admin created user: ${user.email} with role ${role}`,
      targetType: 'user',
      targetId: user._id.toString(),
      targetEmail: user.email,
      changes: [
        { field: 'email', oldValue: null, newValue: user.email },
        { field: 'role', oldValue: null, newValue: role },
      ],
      req,
      tenant: authReq.tenant,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          accountType: user.accountType,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: (user as any).createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/manage/:id - Delete/deactivate user
 * Soft delete by default; superadmin can hard-delete with ?hard=true
 */
export const deleteUserByAdmin: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const user = await User.findOne({ _id: req.params.id, tenant: authReq.tenant });

    if (!user) {
      return next(new CustomError('User not found', 404));
    }

    if (user._id.toString() === authReq.user!._id.toString()) {
      return next(new CustomError('Cannot delete your own account', 400));
    }

    const actorLevel = ROLE_HIERARCHY[authReq.user!.role] || 0;
    const targetLevel = ROLE_HIERARCHY[user.role] || 0;
    if (targetLevel >= actorLevel) {
      return next(new CustomError('Insufficient permissions to delete this user', 403));
    }

    const hardDelete = req.query.hard === 'true' && authReq.user!.role === 'superadmin';
    const deletedEmail = user.email;

    if (hardDelete) {
      await User.deleteOne({ _id: user._id });
    } else {
      user.isActive = false;
      user.email = `deleted_${user._id}@deleted.invalid`;
      user.firstName = 'Deleted';
      user.lastName = 'User';
      await user.save();
    }

    // Invalidate any active sessions for this user
    if (redisClient?.set) {
      try { await redisClient.set(`blacklist:user:${req.params.id}`, '1'); } catch (_) {}
    }

    await createAuditLog({
      actor: authReq.user!,
      action: hardDelete ? 'user_hard_deleted' : 'user_soft_deleted',
      category: 'user_management',
      description: `Admin ${hardDelete ? 'permanently deleted' : 'soft-deleted'} user: ${deletedEmail}`,
      targetType: 'user',
      targetId: req.params.id,
      targetEmail: deletedEmail,
      req,
      tenant: authReq.tenant,
    });

    res.status(200).json({
      success: true,
      message: hardDelete ? 'User permanently deleted' : 'User deactivated and anonymized',
    });
  } catch (error) {
    next(error);
  }
};
