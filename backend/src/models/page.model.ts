import mongoose, { Schema, Document } from 'mongoose';

export interface IPage extends Document {
  tenant: string;
  slug: string;
  title: string;
  body: string; // markdown or HTML
  heroImage?: {
    url?: string;
    storage?: 'local' | 's3';
    alt?: string;
  };
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema: Schema = new Schema(
  {
    tenant: { type: String, required: true, index: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    heroImage: {
      url: String,
      storage: { type: String, enum: ['local', 's3'], default: 'local' },
      alt: String,
    },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PageSchema.index({ tenant: 1, slug: 1 }, { unique: true });

export default mongoose.model<IPage>('Page', PageSchema);
