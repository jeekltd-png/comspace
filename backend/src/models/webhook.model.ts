import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhook extends Document {
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  description?: string;
  failureCount: number;
  lastDeliveryAt?: Date;
  lastDeliveryStatus?: 'success' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema: Schema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Webhook URL is required'],
      validate: {
        validator: (v: string) => /^https?:\/\/.+/.test(v),
        message: 'Must be a valid HTTP(S) URL',
      },
    },
    events: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one event must be specified',
      },
    },
    secret: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: String,
    failureCount: {
      type: Number,
      default: 0,
    },
    lastDeliveryAt: Date,
    lastDeliveryStatus: {
      type: String,
      enum: ['success', 'failed'],
    },
  },
  { timestamps: true }
);

// Auto-disable after 10 consecutive failures
WebhookSchema.index({ tenantId: 1, isActive: 1 });
WebhookSchema.index({ events: 1 });

export default mongoose.model<IWebhook>('Webhook', WebhookSchema);
