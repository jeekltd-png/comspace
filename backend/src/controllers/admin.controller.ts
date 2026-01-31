import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/user.model';
import Order from '../models/order.model';
import Product from '../models/product.model';

export const getDashboardStats: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const [totalUsers, totalOrders, totalProducts, recentOrders] = await Promise.all([
      User.countDocuments({ tenant: authReq.tenant }),
      Order.countDocuments({ tenant: authReq.tenant }),
      Product.countDocuments({ tenant: authReq.tenant }),
      Order.find({ tenant: authReq.tenant }).sort('-createdAt').limit(10),
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { tenant: authReq.tenant, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        recentOrders,
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
