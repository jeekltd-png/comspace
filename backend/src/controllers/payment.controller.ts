import { Response, NextFunction, RequestHandler } from 'express';
import Stripe from 'stripe';
import Order from '../models/order.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
});

export const createPaymentIntent: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { amount, currency = 'USD', orderId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: authReq.user!._id,
      tenant: authReq.tenant,
    });

    if (!order) {
      return next(new CustomError('Order not found', 404));
    }

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
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const order = await Order.findOne({ paymentIntentId });

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

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
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

  res.status(200).json({ received: true });    return;};

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
