import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Webhook from '../models/webhook.model';
import { CustomError } from '../middleware/error.middleware';
import crypto from 'crypto';

const router = Router();

router.use(tenantMiddleware);
router.use(protect);
router.use(authorize('superadmin', 'admin', 'admin1', 'admin2'));

/** List all webhooks for tenant */
const listWebhooks: RequestHandler = async (req, res, next) => {
  try {
    const webhooks = await Webhook.find({ tenantId: (req as AuthRequest).tenant })
      .select('-secret')
      .sort('-createdAt');
    res.json({ success: true, data: { webhooks } });
  } catch (err) {
    next(err);
  }
};

/** Create a new webhook */
const createWebhook: RequestHandler = async (req, res, next) => {
  try {
    const { url, events, description } = req.body;
    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return next(new CustomError('url and events[] are required', 400));
    }

    const secret = crypto.randomBytes(32).toString('hex');
    const webhook = await Webhook.create({
      tenantId: (req as AuthRequest).tenant,
      url,
      events,
      secret,
      description,
    });

    // Return secret only on creation so admin can store it
    res.status(201).json({
      success: true,
      data: {
        webhook: {
          _id: webhook._id,
          url: webhook.url,
          events: webhook.events,
          description: webhook.description,
          isActive: webhook.isActive,
          secret, // Only returned once!
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Update a webhook */
const updateWebhook: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url, events, isActive, description } = req.body;

    const webhook = await Webhook.findOneAndUpdate(
      { _id: id, tenantId: (req as AuthRequest).tenant },
      { url, events, isActive, description },
      { new: true, runValidators: true }
    ).select('-secret');

    if (!webhook) return next(new CustomError('Webhook not found', 404));

    res.json({ success: true, data: { webhook } });
  } catch (err) {
    next(err);
  }
};

/** Delete a webhook */
const deleteWebhook: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Webhook.findOneAndDelete({
      _id: id,
      tenantId: (req as AuthRequest).tenant,
    });
    if (!deleted) return next(new CustomError('Webhook not found', 404));
    res.json({ success: true, message: 'Webhook deleted' });
  } catch (err) {
    next(err);
  }
};

/** Regenerate secret */
const regenerateSecret: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await Webhook.findOneAndUpdate(
      { _id: id, tenantId: (req as AuthRequest).tenant },
      { secret, failureCount: 0 },
      { new: true }
    ).select('-secret');

    if (!webhook) return next(new CustomError('Webhook not found', 404));

    res.json({ success: true, data: { secret } }); // Return new secret once
  } catch (err) {
    next(err);
  }
};

router.get('/', listWebhooks);
router.post('/', createWebhook);
router.put('/:id', updateWebhook);
router.delete('/:id', deleteWebhook);
router.post('/:id/regenerate-secret', regenerateSecret);

export default router;
