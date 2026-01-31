import mongoose, { Schema, Document } from 'mongoose';

export interface IWhiteLabel extends Document {
  tenantId: string;
  name: string;
  domain: string;
  branding: {
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  features: {
    delivery: boolean;
    pickup: boolean;
    reviews: boolean;
    wishlist: boolean;
    chat: boolean;
    socialLogin: boolean;
  };
  payment: {
    stripeAccountId: string;
    supportedMethods: string[];
    currencies: string[];
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  customCSS?: string;
  customJS?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WhiteLabelSchema: Schema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
    },
    branding: {
      logo: { type: String, required: true },
      favicon: String,
      primaryColor: { type: String, default: '#3B82F6' },
      secondaryColor: { type: String, default: '#10B981' },
      accentColor: { type: String, default: '#F59E0B' },
      fontFamily: { type: String, default: 'Inter, sans-serif' },
    },
    features: {
      delivery: { type: Boolean, default: true },
      pickup: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
      wishlist: { type: Boolean, default: true },
      chat: { type: Boolean, default: false },
      socialLogin: { type: Boolean, default: true },
    },
    payment: {
      stripeAccountId: String,
      supportedMethods: [{ type: String }],
      currencies: [{ type: String }],
    },
    contact: {
      email: { type: String, required: true },
      phone: String,
      address: String,
    },
    social: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    customCSS: String,
    customJS: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes are created via field options (unique/index) on the schema fields to avoid duplicate index definitions.

export default mongoose.model<IWhiteLabel>('WhiteLabel', WhiteLabelSchema);
