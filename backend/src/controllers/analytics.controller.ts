import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import UserActivity from '../models/userActivity.model';
import User from '../models/user.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import Review from '../models/Review';

/**
 * Track a user activity event (called from frontend or middleware)
 */
export const trackEvent: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { action, category, metadata, page, duration, sessionId } = req.body;

    if (!action || !category) {
      res.status(400).json({ success: false, message: 'action and category are required' });
      return;
    }

    await UserActivity.create({
      user: authReq.user?._id,
      sessionId: sessionId || req.headers['x-session-id'],
      tenant: authReq.tenant || 'default',
      action,
      category,
      metadata,
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || req.headers.referrer,
      page,
      duration,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch track events (for buffered frontend tracking)
 */
export const trackEventsBatch: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ success: false, message: 'events array is required' });
      return;
    }

    const docs = events.slice(0, 50).map((evt: any) => ({
      user: authReq.user?._id,
      sessionId: evt.sessionId || req.headers['x-session-id'],
      tenant: authReq.tenant || 'default',
      action: evt.action,
      category: evt.category,
      metadata: evt.metadata,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: evt.referrer,
      page: evt.page,
      duration: evt.duration,
    }));

    await UserActivity.insertMany(docs, { ordered: false });

    res.status(201).json({ success: true, tracked: docs.length });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get comprehensive analytics dashboard data
 */
export const getAnalyticsDashboard: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = (authReq.user?.role === 'superadmin' && req.query.tenantId)
      ? (req.query.tenantId as string)
      : authReq.tenant;

    const range = (req.query.range as string) || '30d';
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':  startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      default:    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const previousStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

    const [
      // Current period metrics
      totalUsers,
      activeUsers,
      newUsersCurrentPeriod,
      newUsersPreviousPeriod,
      totalOrders,
      totalProducts,
      revenueCurrentPeriod,
      revenuePreviousPeriod,
      // Activity analytics
      pageViews,
      uniqueVisitors,
      topPages,
      // User engagement
      userActivityByDay,
      // Conversion funnel
      cartAdditions,
      checkoutStarts,
      checkoutCompletes,
      // Product analytics
      topViewedProducts,
      topSoldProducts,
      // Reviews / ratings
      recentReviews,
      avgRating,
      // Order status distribution
      ordersByStatus,
      // User retention (login frequency)
      dailyActiveUsers,
      // Search analytics
      topSearchTerms,
      // Form analytics
      formStarts,
      formCompletions,
    ] = await Promise.all([
      // Total users
      User.countDocuments({ tenant }),
      // Active users (logged in within period)
      User.countDocuments({ tenant, lastLogin: { $gte: startDate } }),
      // New users (current period)
      User.countDocuments({ tenant, createdAt: { $gte: startDate } }),
      // New users (previous period)
      User.countDocuments({ tenant, createdAt: { $gte: previousStart, $lt: startDate } }),
      // Total orders
      Order.countDocuments({ tenant }),
      // Total products
      Product.countDocuments({ tenant }),
      // Revenue current period
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      // Revenue previous period
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed', createdAt: { $gte: previousStart, $lt: startDate } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      // Page views in period
      UserActivity.countDocuments({ tenant, action: 'page_view', createdAt: { $gte: startDate } }),
      // Unique visitors (unique sessions)
      UserActivity.distinct('sessionId', { tenant, createdAt: { $gte: startDate } }).then(s => s.length),
      // Top pages
      UserActivity.aggregate([
        { $match: { tenant, action: 'page_view', createdAt: { $gte: startDate } } },
        { $group: { _id: '$page', views: { $sum: 1 }, uniqueUsers: { $addToSet: '$user' } } },
        { $addFields: { uniqueViews: { $size: '$uniqueUsers' } } },
        { $project: { uniqueUsers: 0 } },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]),
      // User activity by day (for charts)
      UserActivity.aggregate([
        { $match: { tenant, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            events: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
          },
        },
        { $addFields: { users: { $size: '$uniqueUsers' } } },
        { $project: { uniqueUsers: 0 } },
        { $sort: { _id: 1 } },
      ]),
      // Cart additions
      UserActivity.countDocuments({ tenant, action: 'add_to_cart', createdAt: { $gte: startDate } }),
      // Checkout starts
      UserActivity.countDocuments({ tenant, action: 'checkout_start', createdAt: { $gte: startDate } }),
      // Checkout completes
      UserActivity.countDocuments({ tenant, action: 'checkout_complete', createdAt: { $gte: startDate } }),
      // Top viewed products
      UserActivity.aggregate([
        { $match: { tenant, action: 'product_view', createdAt: { $gte: startDate } } },
        { $group: { _id: '$metadata.productId', name: { $first: '$metadata.productName' }, views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]),
      // Top sold products
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed', createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
      ]),
      // Recent reviews
      Review.find({ tenant }).sort('-createdAt').limit(10).populate('user', 'firstName lastName avatar'),
      // Average rating across all reviews
      Review.aggregate([
        { $match: { tenant } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
      ]),
      // Orders by status
      Order.aggregate([
        { $match: { tenant, createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Daily active users
      UserActivity.aggregate([
        { $match: { tenant, category: 'auth', action: 'login', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            users: { $addToSet: '$user' },
          },
        },
        { $addFields: { count: { $size: '$users' } } },
        { $project: { users: 0 } },
        { $sort: { _id: 1 } },
      ]),
      // Top search terms
      UserActivity.aggregate([
        { $match: { tenant, action: 'search', createdAt: { $gte: startDate } } },
        { $group: { _id: '$metadata.query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      // Form starts
      UserActivity.countDocuments({ tenant, action: 'form_start', createdAt: { $gte: startDate } }),
      // Form completions
      UserActivity.countDocuments({ tenant, action: 'form_complete', createdAt: { $gte: startDate } }),
    ]);

    const currentRevenue = revenueCurrentPeriod[0]?.total || 0;
    const previousRevenue = revenuePreviousPeriod[0]?.total || 0;
    const revenueGrowth = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    const userGrowth = newUsersPreviousPeriod > 0
      ? Math.round(((newUsersCurrentPeriod - newUsersPreviousPeriod) / newUsersPreviousPeriod) * 100)
      : newUsersCurrentPeriod > 0 ? 100 : 0;

    const conversionRate = cartAdditions > 0
      ? Math.round((checkoutCompletes / cartAdditions) * 10000) / 100
      : 0;

    const formCompletionRate = formStarts > 0
      ? Math.round((formCompletions / formStarts) * 10000) / 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          newUsers: newUsersCurrentPeriod,
          userGrowth,
          totalOrders,
          ordersInPeriod: revenueCurrentPeriod[0]?.count || 0,
          totalProducts,
          totalRevenue: currentRevenue,
          revenueGrowth,
          avgOrderValue: revenueCurrentPeriod[0]
            ? Math.round((currentRevenue / revenueCurrentPeriod[0].count) * 100) / 100
            : 0,
          pageViews,
          uniqueVisitors,
        },
        engagement: {
          dailyActivity: userActivityByDay,
          dailyActiveUsers,
          topPages,
          topSearchTerms,
        },
        conversion: {
          cartAdditions,
          checkoutStarts,
          checkoutCompletes,
          conversionRate,
          formStarts,
          formCompletions,
          formCompletionRate,
        },
        products: {
          topViewed: topViewedProducts,
          topSold: topSoldProducts,
        },
        reviews: {
          recent: recentReviews,
          avgRating: avgRating[0]?.avgRating ? Math.round(avgRating[0].avgRating * 10) / 10 : 0,
          totalReviews: avgRating[0]?.totalReviews || 0,
        },
        orders: {
          byStatus: ordersByStatus.reduce(
            (acc: Record<string, number>, cur: any) => ({ ...acc, [cur._id]: cur.count }),
            {}
          ),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get detailed user activity log for a specific user
 */
export const getUserActivityLog: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const tenant = authReq.tenant;

    const [activities, total] = await Promise.all([
      UserActivity.find({ user: userId, tenant })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      UserActivity.countDocuments({ user: userId, tenant }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: { page: Number(page), limit: Number(limit), total },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get real-time active users count
 */
export const getActiveUsersRealtime: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const tenant = authReq.tenant;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeSessions = await UserActivity.distinct('sessionId', {
      tenant,
      createdAt: { $gte: fiveMinutesAgo },
    });

    res.status(200).json({
      success: true,
      data: { activeUsers: activeSessions.length },
    });
  } catch (error) {
    next(error);
  }
};
