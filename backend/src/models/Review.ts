import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tenant: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  helpfulBy: mongoose.Types.ObjectId[];
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenant: {
      type: String,
      default: 'default',
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    verified: {
      type: Boolean,
      default: false, // Set to true if user purchased the product
    },
    helpful: {
      type: Number,
      default: 0,
    },
    helpfulBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    images: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate reviews (tenant-scoped)
reviewSchema.index({ productId: 1, userId: 1, tenant: 1 }, { unique: true });

// Index for sorting by helpful votes
reviewSchema.index({ helpful: -1 });

// Index for tenant-scoped product reviews
reviewSchema.index({ tenant: 1, productId: 1 });

// Static method to calculate average rating for a product
reviewSchema.statics.getAverageRating = async function(productId: string, tenant: string = 'default') {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), tenant } },
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { averageRating: 0, totalReviews: 0 };
};

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
