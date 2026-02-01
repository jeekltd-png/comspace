import mongoose, { Schema, Document } from 'mongoose';

export interface IMissingTranslation extends Document {
  tenant: string;
  locale: string;
  keys: string[];
  url?: string;
  userAgent?: string;
  source?: string; // e.g., 'client' or 'server'
  createdAt: Date;
}

const MissingTranslationSchema: Schema = new Schema(
  {
    tenant: { type: String, default: 'default', index: true },
    locale: { type: String, required: true, index: true },
    keys: [{ type: String }],
    url: String,
    userAgent: String,
    source: { type: String, default: 'client' },
  },
  { timestamps: true }
);

MissingTranslationSchema.index({ tenant: 1, locale: 1 });

export default mongoose.model<IMissingTranslation>('MissingTranslation', MissingTranslationSchema);
