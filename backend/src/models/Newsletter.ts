import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  isActive: boolean;
}

const NewsletterSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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

// Index for faster lookups
NewsletterSchema.index({ email: 1 });
NewsletterSchema.index({ isActive: 1 });

export default mongoose.model<INewsletter>('Newsletter', NewsletterSchema);
