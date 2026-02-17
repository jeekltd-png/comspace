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
  /** Business type drives the default UI layout for this tenant */
  businessType: 'ecommerce' | 'salon' | 'hotel' | 'bnb';
  features: {
    // Shopping
    products: boolean;
    pricing: boolean;
    cart: boolean;
    checkout: boolean;
    // Fulfilment
    delivery: boolean;
    pickup: boolean;
    // Community
    reviews: boolean;
    wishlist: boolean;
    chat: boolean;
    socialLogin: boolean;
    // Salon / Booking
    booking: boolean;
    salon: boolean;
    // Hotel / B&B
    hotel: boolean;
    reservations: boolean;
    ratePlans: boolean;
    guestMessaging: boolean;
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
    businessType: {
      type: String,
      enum: ['ecommerce', 'salon', 'hotel', 'bnb'],
      default: 'ecommerce',
    },
    branding: {
      logo: { type: String, required: true },
      favicon: String,
      primaryColor: { type: String, default: '#9333ea' },
      secondaryColor: { type: String, default: '#10B981' },
      accentColor: { type: String, default: '#ec4899' },
      fontFamily: { type: String, default: 'Inter, sans-serif' },
      // New asset metadata for richer image info
      assets: {
        logo: {
          url: String,
          storage: { type: String, enum: ['local','s3'], default: 'local' },
          width: Number,
          height: Number,
          alt: String,
        },
        heroImage: {
          url: String,
          storage: { type: String, enum: ['local','s3'], default: 'local' },
          width: Number,
          height: Number,
          alt: String,
        }
      }
    },
    features: {
      // Shopping capabilities
      products: { type: Boolean, default: true },
      pricing: { type: Boolean, default: true },
      cart: { type: Boolean, default: true },
      checkout: { type: Boolean, default: true },
      // Fulfilment
      delivery: { type: Boolean, default: true },
      pickup: { type: Boolean, default: true },
      // Community
      reviews: { type: Boolean, default: true },
      wishlist: { type: Boolean, default: true },
      chat: { type: Boolean, default: false },
      socialLogin: { type: Boolean, default: true },
      // Salon / Booking
      booking: { type: Boolean, default: false },
      salon: { type: Boolean, default: false },
      // Hotel / B&B
      hotel: { type: Boolean, default: false },
      reservations: { type: Boolean, default: false },
      ratePlans: { type: Boolean, default: false },
      guestMessaging: { type: Boolean, default: false },
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
