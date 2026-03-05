import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IInvoice extends Document {
  invoiceNumber: string;
  /** Unique verification token embedded in QR codes */
  verificationToken: string;
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  tenant: string;
  type: 'invoice' | 'receipt';
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

  // Parties
  from: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    registrationNumber?: string;
    taxId?: string;
    logo?: string;
  };
  to: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };

  // Line items (denormalized from order for archival)
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sku?: string;
  }>;

  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;

  // Payment reference
  paymentMethod?: string;
  paymentIntentId?: string;
  paidAt?: Date;

  // PDF storage
  pdfUrl?: string;
  pdfStorage?: 'local' | 's3';

  // QR Code
  qrCodeDataUrl?: string;

  notes?: string;
  issuedAt: Date;
  dueDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      uppercase: true,
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenant: {
      type: String,
      default: 'default',
      index: true,
    },
    type: {
      type: String,
      enum: ['invoice', 'receipt'],
      default: 'invoice',
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded'],
      default: 'issued',
    },

    from: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      address: String,
      registrationNumber: String,
      taxId: String,
      logo: String,
    },
    to: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      address: String,
    },

    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
        sku: String,
      },
    ],

    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },

    paymentMethod: String,
    paymentIntentId: String,
    paidAt: Date,

    pdfUrl: String,
    pdfStorage: { type: String, enum: ['local', 's3'], default: 'local' },

    qrCodeDataUrl: String,

    notes: String,
    issuedAt: { type: Date, default: Date.now },
    dueDate: Date,
  },
  {
    timestamps: true,
  }
);

// Generate invoice number and verification token before saving
InvoiceSchema.pre('save', async function (this: any, next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Invoice').countDocuments({ tenant: this.tenant }) + 1;
    const padded = String(count).padStart(6, '0');
    this.invoiceNumber = `INV-${year}-${padded}`;
  }

  if (!this.verificationToken) {
    // Cryptographically secure token: 32-byte hex
    this.verificationToken = crypto.randomBytes(32).toString('hex');
  }

  next();
});

// Indexes
InvoiceSchema.index({ invoiceNumber: 1, tenant: 1 }, { unique: true });
InvoiceSchema.index({ order: 1, tenant: 1 });
InvoiceSchema.index({ user: 1, tenant: 1 });
InvoiceSchema.index({ verificationToken: 1 }, { unique: true });
InvoiceSchema.index({ tenant: 1, createdAt: -1 });
InvoiceSchema.index({ tenant: 1, status: 1 });

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
