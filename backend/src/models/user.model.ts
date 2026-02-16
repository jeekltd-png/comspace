import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  // Roles: 'superadmin' has global access; 'admin1' and 'admin2' are tiered admin roles
  // 'admin' kept for backward compatibility; 'merchant' manages tenant-level resources.
  role: 'customer' | 'admin' | 'admin1' | 'admin2' | 'superadmin' | 'merchant';
  // Account classification: what type of entity is this user
  accountType: 'individual' | 'business' | 'association' | 'education';
  organization?: {
    name: string;
    registrationNumber?: string;
    taxId?: string;
    industry?: string;
    mission?: string;
    estimatedMembers?: number;
    // Education-specific fields
    institutionType?: 'primary' | 'secondary' | 'further' | 'higher';
    estimatedStudents?: number;
    urn?: string; // Unique Reference Number
  };
  avatar?: string;
  addresses: Array<{
    label: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    isDefault: boolean;
  }>;
  preferences: {
    currency: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  oauth: {
    google?: string;
    apple?: string;
  };
  tenant: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'admin1', 'admin2', 'superadmin', 'merchant'],
      default: 'customer',
    },
    accountType: {
      type: String,
      enum: ['individual', 'business', 'association', 'education'],
      default: 'individual',
    },
    organization: {
      name: { type: String, trim: true },
      registrationNumber: { type: String, trim: true },
      taxId: { type: String, trim: true },
      industry: { type: String, trim: true },
      mission: { type: String, trim: true },
      estimatedMembers: { type: Number },
      // Education-specific fields
      institutionType: { type: String, enum: ['primary', 'secondary', 'further', 'higher'] },
      estimatedStudents: { type: Number },
      urn: { type: String, trim: true },
    },
    avatar: {
      type: String,
    },
    addresses: [
      {
        label: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true },
        coordinates: {
          lat: Number,
          lng: Number,
        },
        isDefault: { type: Boolean, default: false },
      },
    ],
    preferences: {
      currency: { type: String, default: 'USD' },
      language: { type: String, default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    oauth: {
      google: String,
      apple: String,
    },
    tenant: {
      type: String,
      default: 'default',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = (await bcrypt.genSalt(12)) as string;
  this.password = (await bcrypt.hash(this.password as string, salt)) as string;
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Compound unique index: email unique PER TENANT (not globally)
UserSchema.index({ email: 1, tenant: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ accountType: 1, tenant: 1 });

export default mongoose.model<IUser>('User', UserSchema);
