import { RequestHandler } from 'express';
import Review from '../models/Review';
import Product from '../models/product.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';

/**
 * Get reviews for a product
 * GET /api/reviews/product/:productId
 */
export const getProductReviews: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, sort = '-createdAt', limit = '10', page = '1' } = req.query;

    const query: Record<string, unknown> = { productId };
    if (rating) {
      const parsed = parseInt(rating as string, 10);
      if (parsed >= 1 && parsed <= 5) query.rating = parsed;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Whitelist allowed sort fields
    const allowedSorts = ['-createdAt', 'createdAt', '-rating', 'rating', '-helpful', 'helpful'];
    const sortField = allowedSorts.includes(sort as string) ? (sort as string) : '-createdAt';

    const [reviews, total, stats] = await Promise.all([
      Review.find(query)
        .populate('userId', 'firstName lastName')
        .sort(sortField)
        .limit(limitNum)
        .skip(skip),
      Review.countDocuments(query),
      (Review as any).getAverageRating(productId),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          averageRating: stats?.averageRating || 0,
          totalReviews: stats?.totalReviews || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a review
 * POST /api/reviews
 */
export const createReview: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { productId, rating, title, comment, images } = req.body;
    const userId = authReq.user?.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      throw new CustomError('You have already reviewed this product', 400);
    }

    // TODO: Check if user purchased this product (set verified to true)
    const verified = false;

    const review = await Review.create({
      productId,
      userId,
      rating,
      title,
      comment,
      images,
      verified,
    });

    // Update product rating
    const stats: any = await (Review as any).getAverageRating(productId);
    await Product.findByIdAndUpdate(productId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a review
 * PUT /api/reviews/:id
 */
export const updateReview: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = authReq.user?.id;

    const review = await Review.findById(id);
    if (!review) {
      throw new CustomError('Review not found', 404);
    }

    // Check if user owns this review
    if (review.userId.toString() !== userId?.toString()) {
      throw new CustomError('You can only edit your own reviews', 403);
    }

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = images || review.images;

    await review.save();

    // Update product rating
    const stats: any = await (Review as any).getAverageRating(review.productId.toString());
    await Product.findByIdAndUpdate(review.productId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
    });

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
export const deleteReview: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const userId = authReq.user?.id;
    const userRole = authReq.user?.role;

    const review = await Review.findById(id);
    if (!review) {
      throw new CustomError('Review not found', 404);
    }

    // Check if user owns this review or is any admin role
    const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'merchant';
    if (review.userId.toString() !== userId?.toString() && !isAdmin) {
      throw new CustomError('You can only delete your own reviews', 403);
    }

    const productId = review.productId;
    await review.deleteOne();

    // Update product rating
    const stats: any = await (Review as any).getAverageRating(productId.toString());
    await Product.findByIdAndUpdate(productId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark review as helpful
 * POST /api/reviews/:id/helpful
 */
export const markHelpful: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const userId = authReq.user?.id;

    const review = await Review.findById(id);
    if (!review) {
      throw new CustomError('Review not found', 404);
    }

    // Check if user already voted
    if (review.helpfulBy.includes(userId as any)) {
      throw new CustomError('You have already marked this review as helpful', 400);
    }

    review.helpful += 1;
    review.helpfulBy.push(userId as any);
    await review.save();

    res.json({
      success: true,
      data: { helpful: review.helpful },
      message: 'Thank you for your feedback',
    });
  } catch (error) {
    next(error);
  }
};
