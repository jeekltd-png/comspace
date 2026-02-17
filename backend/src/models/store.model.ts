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
  /** GeoJSON Point for geospatial queries (2dsphere index) */
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  /** @deprecated Use location.coordinates — kept for backward compat */
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
  /** Space preset / business category (e.g. salon, healthcare, food-store) */
  spacePreset?: string;
  /** Discoverable services or tags for public search */
  serviceTags?: string[];
  /** Short public description */
  shortDescription?: string;
  /** Average rating (denormalized) */
  rating?: number;
  /** Number of reviews (denormalized) */
  reviewCount?: number;
  /** Whether this store opts in to public discovery directory */
  isDiscoverable: boolean;
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
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
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
    spacePreset: {
      type: String,
      index: true,
    },
    serviceTags: [{ type: String }],
    shortDescription: {
      type: String,
      maxlength: 500,
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isDiscoverable: {
      type: Boolean,
      default: false,
    },
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

// Sync legacy coordinates → GeoJSON before save
StoreSchema.pre('save', function (next) {
  const doc = this as any;
  if (doc.isModified('coordinates') && doc.coordinates?.lat && doc.coordinates?.lng) {
    doc.location = {
      type: 'Point',
      coordinates: [doc.coordinates.lng, doc.coordinates.lat],
    };
  }
  next();
});

// 2dsphere index for geospatial queries ($nearSphere, $geoNear)
StoreSchema.index({ 'location': '2dsphere' });
StoreSchema.index({ code: 1, tenant: 1 }, { unique: true });
StoreSchema.index({ isDiscoverable: 1, spacePreset: 1, isActive: 1 });
StoreSchema.index({ serviceTags: 1 });

export default mongoose.model<IStore>('Store', StoreSchema);
