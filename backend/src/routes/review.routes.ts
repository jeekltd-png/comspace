import { Router, RequestHandler } from 'express';
import Review from '../models/Review';
import Product from '../models/product.model';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import {
  validate,
  createReviewValidation,
  updateReviewValidation,
  mongoIdParam,
} from '../middleware/validate.middleware';

const router = Router();

// Get reviews for a product
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, sort = '-createdAt', limit = 10, page = 1 } = req.query;

    const query: any = { productId };
    if (rating) {
      query.rating = parseInt(rating as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const reviews = await Review.find(query)
      .populate('userId', 'firstName lastName')
      .sort(sort as string)
      .limit(parseInt(limit as string))
      .skip(skip);

    const total = await Review.countDocuments(query);
    const stats: any = await (Review as any).getAverageRating(productId);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
        stats: {
          averageRating: stats.averageRating || 0,
          totalReviews: stats.totalReviews || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create a review
router.post('/', protect as RequestHandler, validate(createReviewValidation) as RequestHandler, async (req, res, next) => {
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
});

// Update a review
router.put('/:id', protect as RequestHandler, validate(updateReviewValidation) as RequestHandler, async (req, res, next) => {
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
});

// Delete a review
router.delete('/:id', protect as RequestHandler, validate(mongoIdParam()) as RequestHandler, async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const userId = authReq.user?.id;

    const review = await Review.findById(id);
    if (!review) {
      throw new CustomError('Review not found', 404);
    }

    // Check if user owns this review or is admin
    if (review.userId.toString() !== userId?.toString() && authReq.user?.role !== 'admin') {
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
});

// Mark review as helpful
router.post('/:id/helpful', protect as RequestHandler, validate(mongoIdParam()) as RequestHandler, async (req, res, next) => {
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
});

export default router;
