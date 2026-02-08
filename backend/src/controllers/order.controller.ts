import { RequestHandler } from 'express';
import Order from '../models/order.model';
import Cart from '../models/cart.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
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

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax
    const shippingFee = fulfillmentType === 'delivery' ? 10 : 0;
    const total = subtotal + tax + shippingFee;

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
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findOneAndUpdate(
      { _id: id, tenant: (req as AuthRequest).tenant },
      { status, $push: { statusHistory: { status, note, timestamp: new Date() } } },
      { new: true }
    );

    if (!order) {
      return next(new CustomError('Order not found', 404));
    }

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

    res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};
