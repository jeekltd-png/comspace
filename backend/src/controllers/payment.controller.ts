import { Response, NextFunction, RequestHandler } from 'express';
import Stripe from 'stripe';
import Order from '../models/order.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// Lazy-initialize Stripe so the server doesn't crash if the key is unset
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new CustomError('Payment service is not configured', 503);
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any,
    });
  }
  return _stripe;
}

export const createPaymentIntent: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const stripe = getStripe();
    const { currency = 'USD', orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: authReq.user!._id,
      tenant: authReq.tenant,
    });

    if (!order) {
      return next(new CustomError('Order not found', 404));
    }

    // Use server-side order total — never trust client-supplied amount
    const amount = order.total;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        orderId: orderId,
        userId: authReq.user!._id.toString(),
        tenant: authReq.tenant!,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    order.paymentIntentId = paymentIntent.id;
    order.paymentStatus = 'processing';
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPayment: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const stripe = getStripe();
    const { paymentIntentId } = req.body;

    // Validate paymentIntentId format
    if (!paymentIntentId || typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
      return next(new CustomError('Invalid payment intent ID', 400));
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Scope to authenticated user's tenant
      const order = await Order.findOne({
        paymentIntentId,
        user: authReq.user!._id,
        tenant: authReq.tenant,
      });

      if (order) {
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        await order.save();
      }

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: { order },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
      });
    }
  } catch (error) {
    next(error);
  }
};

export const handleStripeWebhook = async (req: any, res: Response, _next: NextFunction) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    logger.warn('Stripe webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const order = await Order.findOne({ paymentIntentId: paymentIntent.id });

      if (order) {
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        await order.save();
      }
      break;

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      const failedOrder = await Order.findOne({ paymentIntentId: failedIntent.id });

      if (failedOrder) {
        failedOrder.paymentStatus = 'failed';
        await failedOrder.save();
      }
      break;
  }

  res.status(200).json({ received: true });
  return;
};

export const getPaymentMethods: RequestHandler = async (_req, res, next) => {
  try {
    // In a real app, retrieve saved payment methods from Stripe
    res.status(200).json({
      success: true,
      data: {
        methods: ['card', 'apple_pay', 'google_pay'],
      },
    });
  } catch (error) {
    next(error);
  }
};
