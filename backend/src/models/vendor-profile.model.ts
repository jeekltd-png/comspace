import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  storeName: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  banner?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  socialLinks?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  policies?: {
    returnPolicy?: string;
    shippingPolicy?: string;
  };
  rating: {
    average: number;
    count: number;
  };
  profileType: 'seller' | 'showcase';
  totalProducts: number;
  totalSales: number;
  isApproved: boolean;
  isActive: boolean;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorProfileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    logo: { type: String },
    banner: { type: String },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    contactPhone: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      postalCode: { type: String, trim: true },
    },
    socialLinks: {
      website: String,
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
    },
    policies: {
      returnPolicy: String,
      shippingPolicy: String,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    profileType: {
      type: String,
      enum: ['seller', 'showcase'],
      default: 'seller',
    },
    totalProducts: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tenant: {
      type: String,
      default: 'default',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique indexes
VendorProfileSchema.index({ slug: 1, tenant: 1 }, { unique: true });
VendorProfileSchema.index({ userId: 1, tenant: 1 }, { unique: true });

export default mongoose.model<IVendorProfile>('VendorProfile', VendorProfileSchema);
