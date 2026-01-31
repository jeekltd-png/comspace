import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: Array<{
    product: mongoose.Types.ObjectId;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    currency: string;
    image: string;
    variant?: string;
  }>;
  subtotal: number;
  tax: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
  fulfillmentType: 'delivery' | 'pickup';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  pickupLocation?: {
    storeId: mongoose.Types.ObjectId;
    storeName: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'out-for-delivery'
    | 'delivered'
    | 'ready-for-pickup'
    | 'picked-up'
    | 'cancelled'
    | 'refunded';
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
  tenant: string;
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        sku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        currency: { type: String, required: true },
        image: String,
        variant: String,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentIntentId: String,
    fulfillmentType: {
      type: String,
      enum: ['delivery', 'pickup'],
      required: true,
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    pickupLocation: {
      storeId: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
      },
      storeName: String,
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'out-for-delivery',
        'delivered',
        'ready-for-pickup',
        'picked-up',
        'cancelled',
        'refunded',
      ],
      default: 'pending',
    },
    trackingNumber: String,
    estimatedDelivery: Date,
    notes: String,
    tenant: {
      type: String,
      default: 'default',
      index: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
OrderSchema.pre('save', async function (this: any, next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(5, '0')}`;
  }

  // Add status to history
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }

  next();
});

// Indexes
// Order number index is managed by the schema field (unique) to avoid duplicate index warnings.
OrderSchema.index({ user: 1, tenant: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
