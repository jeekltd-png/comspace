import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  tenant: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  isActive: boolean;
}

const NewsletterSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    // unique removed — compound index below scopes uniqueness per tenant
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  tenant: {
    type: String,
    default: 'default',
    index: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Unique email per tenant (multi-tenancy safe)
NewsletterSchema.index({ email: 1, tenant: 1 }, { unique: true });
NewsletterSchema.index({ isActive: 1 });

export default mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
