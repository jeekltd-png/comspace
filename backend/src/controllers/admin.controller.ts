import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/user.model';
import Order from '../models/order.model';
import Product from '../models/product.model';

export const getDashboardStats: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    // Superadmin can view any tenant's dashboard via ?tenantId=xxx
    const tenant = (authReq.user?.role === 'superadmin' && req.query.tenantId)
      ? (req.query.tenantId as string)
      : authReq.tenant;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalOrders,
      totalProducts,
      recentOrders,
      revenueAll,
      revenue30d,
      newUsers30d,
      ordersByStatus,
      topProducts,
      dailyRevenue,
    ] = await Promise.all([
      User.countDocuments({ tenant }),
      Order.countDocuments({ tenant }),
      Product.countDocuments({ tenant }),
      Order.find({ tenant }).sort('-createdAt').limit(10).populate('user', 'firstName lastName email'),
      // Total revenue (all time)
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      // Revenue last 30 days
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      // New users last 30 days
      User.countDocuments({ tenant, createdAt: { $gte: thirtyDaysAgo } }),
      // Orders grouped by status
      Order.aggregate([
        { $match: { tenant } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Top 5 selling products
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
      ]),
      // Daily revenue last 7 days
      Order.aggregate([
        { $match: { tenant, paymentStatus: 'completed', createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Average order value
    const avgOrderValue = revenueAll[0]
      ? Math.round((revenueAll[0].total / revenueAll[0].count) * 100) / 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalRevenue: revenueAll[0]?.total || 0,
          revenue30d: revenue30d[0]?.total || 0,
          orders30d: revenue30d[0]?.count || 0,
          newUsers30d,
          avgOrderValue,
        },
        recentOrders,
        ordersByStatus: ordersByStatus.reduce(
          (acc: Record<string, number>, cur: any) => ({ ...acc, [cur._id]: cur.count }),
          {}
        ),
        topProducts,
        dailyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find({ tenant: authReq.tenant }).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments({ tenant: authReq.tenant }),
    ]);

    res.status(200).json({
      success: true,
      data: { users, pagination: { page: Number(page), limit: Number(limit), total } },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrdersList: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ tenant: authReq.tenant })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'firstName lastName email'),
      Order.countDocuments({ tenant: authReq.tenant }),
    ]);

    res.status(200).json({
      success: true,
      data: { orders, pagination: { page: Number(page), limit: Number(limit), total } },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductsList: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find({ tenant: authReq.tenant }).sort('-createdAt').skip(skip).limit(Number(limit)),
      Product.countDocuments({ tenant: authReq.tenant }),
    ]);

    res.status(200).json({
      success: true,
      data: { products, pagination: { page: Number(page), limit: Number(limit), total } },
    });
  } catch (error) {
    next(error);
  }
};

export const generateSalesReport: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { startDate, endDate } = req.query;

    const match: any = { tenant: authReq.tenant, paymentStatus: 'completed' };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate as string);
      if (endDate) match.createdAt.$lte = new Date(endDate as string);
    }

    const salesData = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, data: { salesData } });
  } catch (error) {
    next(error);
  }
};

export const generateInventoryReport: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const lowStockProducts = await Product.find({
      tenant: authReq.tenant,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      isUnlimited: false,
    });

    const outOfStock = await Product.countDocuments({
      tenant: authReq.tenant,
      stock: 0,
      isUnlimited: false,
    });

    res.status(200).json({
      success: true,
      data: {
        lowStockProducts,
        outOfStockCount: outOfStock,
      },
    });
  } catch (error) {
    next(error);
  }
};
