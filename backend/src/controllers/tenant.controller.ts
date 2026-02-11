/**
 * Tenant Management Controller — superadmin-only endpoints
 *
 * Provides full CRUD for tenants (backed by the WhiteLabel model)
 * plus cross-tenant aggregate statistics so the platform owner can
 * see what's happening across all tenants from a single dashboard.
 */

import { RequestHandler } from 'express';
import WhiteLabel from '../models/white-label.model';
import User from '../models/user.model';
import Order from '../models/order.model';
import Product from '../models/product.model';

// ────────────────────────────────────────────────────────────────────────────
// GET /api/admin/tenants — list all tenants with user/product/order counts
// ────────────────────────────────────────────────────────────────────────────
export const listTenants: RequestHandler = async (_req, res, next) => {
  try {
    const tenants = await WhiteLabel.find().sort('name').lean();

    // Collect tenant IDs for aggregation
    const tenantIds = tenants.map((t) => t.tenantId);

    // Count users, products, orders per tenant in parallel
    const [userCounts, productCounts, orderCounts, revenueTotals] = await Promise.all([
      User.aggregate([
        { $match: { tenant: { $in: tenantIds } } },
        { $group: { _id: '$tenant', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      ]),
      Product.aggregate([
        { $match: { tenant: { $in: tenantIds } } },
        { $group: { _id: '$tenant', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      ]),
      Order.aggregate([
        { $match: { tenant: { $in: tenantIds } } },
        { $group: { _id: '$tenant', total: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { tenant: { $in: tenantIds }, paymentStatus: 'completed' } },
        { $group: { _id: '$tenant', revenue: { $sum: '$total' } } },
      ]),
    ]);

    // Build lookup maps
    const users = Object.fromEntries(userCounts.map((u: any) => [u._id, u]));
    const products = Object.fromEntries(productCounts.map((p: any) => [p._id, p]));
    const orders = Object.fromEntries(orderCounts.map((o: any) => [o._id, o]));
    const revenue = Object.fromEntries(revenueTotals.map((r: any) => [r._id, r]));

    // Determine tenant type from the dominant user accountType
    const accountTypeCounts = await User.aggregate([
      { $match: { tenant: { $in: tenantIds }, role: { $in: ['admin', 'merchant'] } } },
      { $group: { _id: { tenant: '$tenant', accountType: '$accountType' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const tenantTypes: Record<string, string> = {};
    for (const item of accountTypeCounts) {
      const tid = item._id.tenant;
      if (!tenantTypes[tid]) tenantTypes[tid] = item._id.accountType;
    }

    const enrichedTenants = tenants.map((t) => ({
      _id: t._id,
      tenantId: t.tenantId,
      name: t.name,
      domain: t.domain,
      type: tenantTypes[t.tenantId] || (t.tenantId === 'default' ? 'platform' : 'individual'),
      isActive: t.isActive,
      branding: {
        primaryColor: t.branding?.primaryColor,
        logo: t.branding?.logo,
      },
      stats: {
        users: users[t.tenantId]?.total || 0,
        activeUsers: users[t.tenantId]?.active || 0,
        products: products[t.tenantId]?.total || 0,
        activeProducts: products[t.tenantId]?.active || 0,
        orders: orders[t.tenantId]?.total || 0,
        revenue: revenue[t.tenantId]?.revenue || 0,
      },
      contact: t.contact,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.status(200).json({ success: true, data: { tenants: enrichedTenants, total: enrichedTenants.length } });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/admin/tenants/:tenantId — single tenant detail with full stats
// ────────────────────────────────────────────────────────────────────────────
export const getTenantDetail: RequestHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const tenant = await WhiteLabel.findOne({ tenantId }).lean();
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found' });
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const [
      totalUsers, activeUsers, newUsersLast30d,
      totalProducts, activeProducts,
      totalOrders, recentOrders,
      revenueAll, revenue30d,
      usersByRole, usersByAccountType,
      admins,
    ] = await Promise.all([
      User.countDocuments({ tenant: tenantId }),
      User.countDocuments({ tenant: tenantId, isActive: true }),
      User.countDocuments({ tenant: tenantId, createdAt: { $gte: thirtyDaysAgo } }),
      Product.countDocuments({ tenant: tenantId }),
      Product.countDocuments({ tenant: tenantId, isActive: true }),
      Order.countDocuments({ tenant: tenantId }),
      Order.find({ tenant: tenantId }).sort('-createdAt').limit(5).lean(),
      Order.aggregate([
        { $match: { tenant: tenantId, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { tenant: tenantId, paymentStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { tenant: tenantId } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { tenant: tenantId } },
        { $group: { _id: '$accountType', count: { $sum: 1 } } },
      ]),
      User.find({ tenant: tenantId, role: { $in: ['superadmin', 'admin', 'admin1', 'admin2', 'merchant'] } })
        .select('firstName lastName email role accountType lastLogin isActive')
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        tenant,
        stats: {
          users: { total: totalUsers, active: activeUsers, newLast30d: newUsersLast30d },
          products: { total: totalProducts, active: activeProducts },
          orders: { total: totalOrders, recentOrders },
          revenue: {
            allTime: revenueAll[0]?.total || 0,
            last30d: revenue30d[0]?.total || 0,
            orderCount: revenueAll[0]?.count || 0,
          },
          usersByRole: Object.fromEntries(usersByRole.map((r: any) => [r._id, r.count])),
          usersByAccountType: Object.fromEntries(usersByAccountType.map((r: any) => [r._id, r.count])),
        },
        admins,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/admin/tenants — create a new tenant
// ────────────────────────────────────────────────────────────────────────────
export const createTenant: RequestHandler = async (req, res, next) => {
  try {
    const { tenantId, name, domain, branding, features, contact, payment, social, seo, customCSS } = req.body;

    if (!tenantId || !name || !domain || !contact?.email) {
      res.status(400).json({ success: false, message: 'tenantId, name, domain, and contact.email are required' });
      return;
    }

    // Check uniqueness
    const existing = await WhiteLabel.findOne({ $or: [{ tenantId }, { domain }] });
    if (existing) {
      res.status(409).json({ success: false, message: `Tenant with that ${existing.tenantId === tenantId ? 'ID' : 'domain'} already exists` });
      return;
    }

    const tenant = await WhiteLabel.create({
      tenantId,
      name,
      domain,
      branding: branding || { logo: '/images/logo.png', primaryColor: '#6C63FF', secondaryColor: '#10B981', accentColor: '#ec4899' },
      features: features || {},
      contact,
      payment: payment || { supportedMethods: ['card'], currencies: ['USD'] },
      social: social || {},
      seo: seo || { title: name, description: '' },
      customCSS: customCSS || '',
    });

    res.status(201).json({ success: true, data: { tenant } });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/tenants/:tenantId — update a tenant
// ────────────────────────────────────────────────────────────────────────────
export const updateTenant: RequestHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;

    // Prevent changing the tenantId itself
    delete updates.tenantId;

    const tenant = await WhiteLabel.findOneAndUpdate({ tenantId }, { $set: updates }, { new: true, runValidators: true });
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found' });
      return;
    }

    res.status(200).json({ success: true, data: { tenant } });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/tenants/:tenantId/toggle — activate / deactivate a tenant
// ────────────────────────────────────────────────────────────────────────────
export const toggleTenant: RequestHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    if (tenantId === 'default') {
      res.status(400).json({ success: false, message: 'Cannot deactivate the default tenant' });
      return;
    }

    const tenant = await WhiteLabel.findOne({ tenantId });
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found' });
      return;
    }

    tenant.isActive = !tenant.isActive;
    await tenant.save();

    res.status(200).json({ success: true, data: { tenant, message: `Tenant ${tenant.isActive ? 'activated' : 'deactivated'}` } });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/admin/tenants/stats/overview — cross-tenant aggregate statistics
// ────────────────────────────────────────────────────────────────────────────
export const getCrossTenantStats: RequestHandler = async (_req, res, next) => {
  try {
    const [
      totalTenants, activeTenants,
      totalUsers, totalProducts, totalOrders,
      totalRevenue,
      usersByTenant,
    ] = await Promise.all([
      WhiteLabel.countDocuments(),
      WhiteLabel.countDocuments({ isActive: true }),
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      User.aggregate([
        { $group: { _id: '$tenant', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        usersByTenant: Object.fromEntries(usersByTenant.map((u: any) => [u._id, u.count])),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/admin/tenants/:tenantId/users — list users for a specific tenant
// ────────────────────────────────────────────────────────────────────────────
export const getTenantUsers: RequestHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const role = req.query.role as string;

    const filter: Record<string, any> = { tenant: tenantId };
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName email role accountType isActive isVerified lastLogin createdAt')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET /api/admin/tenants/:tenantId/dashboard — full dashboard for a tenant
//   (same as existing getDashboardStats but for any tenant)
// ────────────────────────────────────────────────────────────────────────────
export const getTenantDashboard: RequestHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const tenant = tenantId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    const [
      totalUsers, totalOrders, totalProducts,
      recentOrders, revenueAll, revenue30d,
      newUsers30d, ordersByStatus, topProducts, dailyRevenue,
    ] = await Promise.all([
      User.countDocuments({ tenant }),
      Order.countDocuments({ tenant }),
      Product.countDocuments({ tenant }),
      Order.find({ tenant }).sort('-createdAt').limit(10).populate('user', 'firstName lastName email').lean(),
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      User.countDocuments({ tenant, createdAt: { $gte: thirtyDaysAgo } }),
      Order.aggregate([{ $match: { tenant } }, { $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed', createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const avgOrderValue = revenueAll[0]
      ? Math.round((revenueAll[0].total / revenueAll[0].count) * 100) / 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        tenantId: tenant,
        stats: {
          totalUsers, totalOrders, totalProducts,
          totalRevenue: revenueAll[0]?.total || 0,
          revenue30d: revenue30d[0]?.total || 0,
          orders30d: revenue30d[0]?.count || 0,
          newUsers30d, avgOrderValue,
        },
        recentOrders,
        ordersByStatus: ordersByStatus.reduce((acc: Record<string, number>, cur: any) => ({ ...acc, [cur._id]: cur.count }), {}),
        topProducts,
        dailyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};
