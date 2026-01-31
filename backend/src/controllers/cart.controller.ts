import { RequestHandler } from 'express';
import Cart from '../models/cart.model';
import Product from '../models/product.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
export const getCart: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    let cart = await Cart.findOne({ user: authReq.user!._id, tenant: authReq.tenant }).populate(
      'items.product'
    );

    if (!cart) {
      cart = await Cart.create({ user: authReq.user!._id, tenant: authReq.tenant, items: [] });
    }

    res.status(200).json({ success: true, data: { cart } });
  } catch (error) {
    next(error);
  }
};

export const addToCart: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { productId, quantity, variant } = req.body;

    const product = await Product.findById(productId);
    if (!product) return next(new CustomError('Product not found', 404));

    let cart = await Cart.findOne({ user: authReq.user!._id, tenant: authReq.tenant });
    if (!cart) {
      cart = await Cart.create({ user: authReq.user!._id, tenant: authReq.tenant, items: [] });
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === productId && item.variant === variant
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.basePrice,
        currency: product.currency,
        variant,
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({ success: true, data: { cart } });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: authReq.user!._id, tenant: authReq.tenant });
    if (!cart) return next(new CustomError('Cart not found', 404));

    const item = cart.items.find(i => i.product.toString() === productId);
    if (!item) return next(new CustomError('Item not in cart', 404));

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({ success: true, data: { cart } });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: authReq.user!._id, tenant: authReq.tenant });
    if (!cart) return next(new CustomError('Cart not found', 404));

    cart.items = cart.items.filter(i => i.product.toString() !== productId);
    await cart.save();

    res.status(200).json({ success: true, data: { cart } });
  } catch (error) {
    next(error);
  }
};

export const clearCart: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const cart = await Cart.findOne({ user: authReq.user!._id, tenant: authReq.tenant });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};
