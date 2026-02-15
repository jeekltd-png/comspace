import { RequestHandler } from 'express';
import Order from '../models/order.model';
import Cart from '../models/cart.model';
import Product from '../models/product.model';
import WhiteLabel from '../models/white-label.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { dispatchWebhook, WEBHOOK_EVENTS } from '../utils/webhook';
import { createAuditLog } from '../utils/audit';

// Default tax/shipping — overridable per tenant via white-label config or env vars
const DEFAULT_TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE || '0.10');
const DEFAULT_SHIPPING_FEE = parseFloat(process.env.DEFAULT_SHIPPING_FEE || '10');
const FREE_SHIPPING_THRESHOLD = parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '50');

export const createOrder: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { fulfillmentType, deliveryAddress, pickupLocation, notes } = req.body;

    const cart = await Cart.findOne({ user: authReq.user!._id, tenant: authReq.tenant }).populate(
      'items.product'
    );

    if (!cart || cart.items.length === 0) {
      return next(new CustomError('Cart is empty', 400));
    }

    // Retrieve tenant-specific tax/shipping settings
    let taxRate = DEFAULT_TAX_RATE;
    let baseShippingFee = DEFAULT_SHIPPING_FEE;
    try {
      const tenantConfig = await WhiteLabel.findOne({ tenantId: authReq.tenant, isActive: true });
      if (tenantConfig) {
        taxRate = (tenantConfig as any).taxRate ?? DEFAULT_TAX_RATE;
        baseShippingFee = (tenantConfig as any).shippingFee ?? DEFAULT_SHIPPING_FEE;
      }
    } catch (_) { /* Fallback to defaults */ }

    const items = cart.items.map(item => ({
      product: item.product._id,
      name: (item.product as any).name,
      sku: (item.product as any).sku,
      quantity: item.quantity,
      price: item.price,
      currency: item.currency,
      image: (item.product as any).images[0]?.url,
      variant: item.variant,
    }));

    // ── Stock validation & decrement ──
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(new CustomError(`Product "${item.name}" no longer exists`, 400));
      }
      if (!product.isUnlimited) {
        if (product.stock < item.quantity) {
          return next(
            new CustomError(
              `Insufficient stock for "${item.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
              400
            )
          );
        }
        // Atomic decrement to avoid race conditions
        const updated = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        if (!updated) {
          return next(new CustomError(`Stock for "${item.name}" was claimed by another order. Please try again.`, 409));
        }
        // Low stock alert
        if (updated.stock <= updated.lowStockThreshold) {
          logger.warn('Low stock alert', {
            productId: updated._id,
            name: updated.name,
            stock: updated.stock,
            threshold: updated.lowStockThreshold,
            tenant: authReq.tenant,
          });
        }
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const shippingFee = fulfillmentType === 'delivery'
      ? (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : baseShippingFee)
      : 0;
    const total = Math.round((subtotal + tax + shippingFee) * 100) / 100;

    const order = await Order.create({
      user: authReq.user!._id,
      items,
      subtotal,
      tax,
      shippingFee,
      total,
      currency: items[0].currency,
      paymentMethod: 'stripe',
      fulfillmentType,
      deliveryAddress,
      pickupLocation,
      notes,
      tenant: authReq.tenant,
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    // Dispatch webhook event (fire & forget)
    dispatchWebhook(authReq.tenant || 'default', WEBHOOK_EVENTS.ORDER_CREATED, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      currency: order.currency,
      itemCount: order.items.length,
    }).catch(() => {});

    res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

export const getOrders: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query: any = { user: authReq.user!._id, tenant: authReq.tenant };

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrder: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: authReq.user!._id,
      tenant: authReq.tenant,
    }).populate('items.product');

    if (!order) {
      return next(new CustomError('Order not found', 404));
    }

    res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const oldOrder = await Order.findOne({ _id: id, tenant: authReq.tenant });
    const oldStatus = oldOrder?.status;

    const order = await Order.findOneAndUpdate(
      { _id: id, tenant: authReq.tenant },
      { status, $push: { statusHistory: { status, note, timestamp: new Date() } } },
      { new: true }
    );

    if (!order) {
      return next(new CustomError('Order not found', 404));
    }

    // Audit trail for order status changes
    createAuditLog({
      actor: authReq.user!,
      action: 'order_status_changed',
      category: 'order',
      description: `Order ${order.orderNumber} status changed: ${oldStatus} → ${status}`,
      targetType: 'order',
      targetId: order._id.toString(),
      changes: [{ field: 'status', oldValue: oldStatus, newValue: status }],
      metadata: { note, orderNumber: order.orderNumber },
      req,
      tenant: authReq.tenant,
    }).catch(() => {});

    res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: authReq.user!._id, tenant: authReq.tenant });

    if (!order) {
      return next(new CustomError('Order not found', 404));
    }

    if (['shipped', 'delivered', 'picked-up'].includes(order.status)) {
      return next(new CustomError('Cannot cancel order at this stage', 400));
    }

    order.status = 'cancelled';
    await order.save();

    // Restore stock for cancelled order items
    for (const item of order.items) {
      if (item.product) {
        await Product.findOneAndUpdate(
          { _id: item.product, isUnlimited: false },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    // Dispatch webhook event (fire & forget)
    dispatchWebhook(authReq.tenant || 'default', WEBHOOK_EVENTS.ORDER_CANCELLED, {
      orderId: order._id,
      orderNumber: order.orderNumber,
    }).catch(() => {});

    res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};
