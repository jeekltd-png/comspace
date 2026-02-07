import express, { Request, Response } from 'express';
import Newsletter from '../models/Newsletter';
import { sendNewsletterConfirmation } from '../utils/email.service';

const router = express.Router();

// Subscribe to newsletter
router.post('/subscribe', async (req: Request, res: Response): Promise<any> => {
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
      return res.status(400).json({ message: 'This email is already subscribed' });
    }

    // Create new subscription
    const subscription = new Newsletter({
      email: email.toLowerCase(),
      subscribedAt: new Date(),
      isActive: true
    });

    await subscription.save();

    // Send confirmation email (non-blocking)
    sendNewsletterConfirmation(email.toLowerCase()).catch(err => {
      console.error('Failed to send confirmation email:', err);
    });

    res.status(201).json({
      message: 'Successfully subscribed to newsletter! Check your email for confirmation.',
      email: email.toLowerCase()
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ message: 'Failed to subscribe. Please try again later.' });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const subscription = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Email not found in our newsletter list' });
    }

    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    res.json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return res.status(500).json({ message: 'Failed to unsubscribe. Please try again later.' });
  }
});

export default router;
