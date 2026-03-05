/**
 * User Dashboard Controller
 * 
 * Provides comprehensive dashboard data for authenticated users:
 * - Order history summary & spending analytics
 * - Membership status
 * - Recent invoices
 * - Activity feed
 * - Spending trends
 */

import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Order from '../models/order.model';
import Invoice from '../models/invoice.model';
import Membership from '../models/membership.model';

export const getUserDashboard: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const userId = authReq.user!._id;
    const tenant = authReq.tenant;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      recentOrders,
      totalSpentResult,
      spentLast30dResult,
      monthlySpending,
      ordersByStatus,
      recentInvoices,
      membership,
    ] = await Promise.all([
      // Total orders
      Order.countDocuments({ user: userId, tenant }),
      // Completed (delivered / picked-up)
      Order.countDocuments({ user: userId, tenant, status: { $in: ['delivered', 'picked-up'] } }),
      // Active/pending
      Order.countDocuments({
        user: userId, tenant,
        status: { $in: ['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'ready-for-pickup'] },
      }),
      // Cancelled
      Order.countDocuments({ user: userId, tenant, status: 'cancelled' }),
      // Recent orders (last 10)
      Order.find({ user: userId, tenant })
        .sort('-createdAt')
        .limit(10)
        .select('orderNumber total currency status createdAt items.name items.image fulfillmentType'),
      // Total spent (all time)
      Order.aggregate([
        { $match: { user: userId, tenant, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      // Spent last 30 days
      Order.aggregate([
        { $match: { user: userId, tenant, paymentStatus: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      // Monthly spending (last 6 months)
      Order.aggregate([
        { $match: { user: userId, tenant, paymentStatus: 'completed', createdAt: { $gte: ninetyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            total: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Orders by status breakdown
      Order.aggregate([
        { $match: { user: userId, tenant } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Recent invoices
      Invoice.find({ user: userId, tenant })
        .sort('-createdAt')
        .limit(5)
        .select('invoiceNumber type status total currency issuedAt pdfUrl'),
      // Membership
      Membership.findOne({ user: userId, tenant, status: { $in: ['active', 'pending'] } })
        .populate('plan', 'name amount currency interval features'),
    ]);

    const totalSpent = totalSpentResult[0]?.total || 0;
    const spent30d = spentLast30dResult[0]?.total || 0;
    const avgOrderValue = totalSpentResult[0]
      ? Math.round((totalSpentResult[0].total / totalSpentResult[0].count) * 100) / 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          completedOrders,
          pendingOrders,
          cancelledOrders,
          totalSpent,
          spent30d,
          avgOrderValue,
        },
        recentOrders,
        monthlySpending,
        ordersByStatus: ordersByStatus.reduce(
          (acc: Record<string, number>, cur: any) => ({ ...acc, [cur._id]: cur.count }),
          {}
        ),
        recentInvoices,
        membership: membership
          ? {
              status: membership.status,
              plan: (membership as any).plan,
              memberNumber: membership.memberNumber,
              renewalDate: membership.expiryDate || membership.nextDueDate,
              autoRenew: membership.autoRenew,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
