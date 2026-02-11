import { Request, Response, NextFunction, RequestHandler } from 'express';
import Newsletter from '../models/Newsletter';
import { sendNewsletterConfirmation } from '../utils/email.service';
import { logger } from '../utils/logger';

/**
 * Subscribe to newsletter
 * POST /api/newsletter/subscribe
 */
export const subscribe: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email already exists
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ message: 'This email is already subscribed' });
      }
      // Re-activate previous subscription
      existing.isActive = true;
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = undefined;
      await existing.save();

      sendNewsletterConfirmation(email.toLowerCase()).catch(err => {
        logger.error('Failed to send confirmation email:', err);
      });

      return res.status(200).json({
        message: 'Welcome back! You have been re-subscribed.',
        email: email.toLowerCase(),
      });
    }

    // Create new subscription
    const subscription = new Newsletter({
      email: email.toLowerCase(),
      subscribedAt: new Date(),
      isActive: true,
    });

    await subscription.save();

    // Send confirmation email (non-blocking)
    sendNewsletterConfirmation(email.toLowerCase()).catch(err => {
      logger.error('Failed to send confirmation email:', err);
    });

    res.status(201).json({
      message: 'Successfully subscribed to newsletter! Check your email for confirmation.',
      email: email.toLowerCase(),
    });
  } catch (error) {
    logger.error('Newsletter subscription error:', error);
    next(error);
  }
};

/**
 * Unsubscribe from newsletter
 * POST /api/newsletter/unsubscribe
 */
export const unsubscribe: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const subscription = await Newsletter.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return res.status(404).json({ message: 'Email not found in our newsletter list' });
    }

    if (!subscription.isActive) {
      return res.status(400).json({ message: 'This email is already unsubscribed' });
    }

    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    res.json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    logger.error('Newsletter unsubscribe error:', error);
    next(error);
  }
};
