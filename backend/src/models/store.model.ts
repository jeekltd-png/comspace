import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  phone: string;
  email: string;
  hours: Array<{
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }>;
  inventory: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
  }>;
  isActive: boolean;
  tenant: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    hours: [
      {
        day: { type: String, required: true },
        open: { type: String, required: true },
        close: { type: String, required: true },
        isClosed: { type: Boolean, default: false },
      },
    ],
    inventory: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: { type: Number, default: 0 },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
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

StoreSchema.index({ coordinates: '2dsphere' });
StoreSchema.index({ code: 1, tenant: 1 }, { unique: true });

export default mongoose.model<IStore>('Store', StoreSchema);
