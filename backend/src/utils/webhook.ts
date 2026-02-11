/**
 * Webhook event dispatcher.
 *
 * Emits events to registered webhook endpoints for a given tenant.
 * Supports retry logic, HMAC signature verification, and automatic
 * deactivation after repeated failures.
 */

import crypto from 'crypto';
import axios from 'axios';
import Webhook from '../models/webhook.model';
import { logger } from './logger';

/** Standard webhook event types */
export const WEBHOOK_EVENTS = {
  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_COMPLETED: 'order.completed',
  // Product events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_LOW_STOCK: 'product.low_stock',
  PRODUCT_OUT_OF_STOCK: 'product.out_of_stock',
  // User events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
  // Payment events
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
} as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Sign a webhook payload using HMAC-SHA256.
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Dispatch a webhook event to all active subscribers for a tenant.
 * Runs asynchronously — does NOT block the calling code.
 */
export async function dispatchWebhook(
  tenantId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const webhooks = await Webhook.find({
      tenantId,
      isActive: true,
      events: event,
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const body = JSON.stringify(payload);

    const deliveryPromises = webhooks.map(async (webhook) => {
      const signature = signPayload(body, webhook.secret);

      try {
        await axios.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': `sha256=${signature}`,
            'X-Webhook-Event': event,
            'X-Webhook-Delivery-Id': crypto.randomUUID(),
          },
          timeout: 10000, // 10s timeout
        });

        // Success — reset failure counter
        await Webhook.updateOne(
          { _id: webhook._id },
          {
            $set: {
              failureCount: 0,
              lastDeliveryAt: new Date(),
              lastDeliveryStatus: 'success',
            },
          }
        );

        logger.info('Webhook delivered', {
          webhookId: webhook._id,
          event,
          url: webhook.url,
          tenantId,
        });
      } catch (error: any) {
        const newFailureCount = webhook.failureCount + 1;
        const shouldDisable = newFailureCount >= 10;

        await Webhook.updateOne(
          { _id: webhook._id },
          {
            $set: {
              failureCount: newFailureCount,
              lastDeliveryAt: new Date(),
              lastDeliveryStatus: 'failed',
              ...(shouldDisable ? { isActive: false } : {}),
            },
          }
        );

        logger.warn('Webhook delivery failed', {
          webhookId: webhook._id,
          event,
          url: webhook.url,
          tenantId,
          failureCount: newFailureCount,
          disabled: shouldDisable,
          error: error.message,
        });
      }
    });

    // Fire all deliveries in parallel (don't await in calling code)
    await Promise.allSettled(deliveryPromises);
  } catch (error) {
    logger.error('Webhook dispatch error', { tenantId, event, error });
  }
}

/**
 * Verify a webhook signature (for consumers to validate incoming webhooks).
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = `sha256=${signPayload(payload, secret)}`;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
