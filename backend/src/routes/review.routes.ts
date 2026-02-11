import { Router, RequestHandler } from 'express';
import { protect } from '../middleware/auth.middleware';
import { reviewLimiter } from '../middleware/rate-limit.middleware';
import {
  validate,
  createReviewValidation,
  updateReviewValidation,
  mongoIdParam,
} from '../middleware/validate.middleware';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
} from '../controllers/review.controller';

const router = Router();

// Get reviews for a product
router.get('/product/:productId', getProductReviews);

// Create a review
router.post('/', protect as RequestHandler, reviewLimiter as RequestHandler, validate(createReviewValidation) as RequestHandler, createReview);

// Update a review
router.put('/:id', protect as RequestHandler, validate(updateReviewValidation) as RequestHandler, updateReview);

// Delete a review
router.delete('/:id', protect as RequestHandler, validate(mongoIdParam()) as RequestHandler, deleteReview);

// Mark review as helpful
router.post('/:id/helpful', protect as RequestHandler, validate(mongoIdParam()) as RequestHandler, markHelpful);

export default router;
