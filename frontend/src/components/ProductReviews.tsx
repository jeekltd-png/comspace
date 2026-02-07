'use client';

import React, { useState } from 'react';
import { FiStar, FiThumbsUp, FiCheck } from 'react-icons/fi';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  images?: string[];
}

interface ProductReviewsProps {
  productId: string;
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
}

export default function ProductReviews({ 
  productId, 
  reviews = [], 
  averageRating = 0,
  totalReviews = 0 
}: ProductReviewsProps) {
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === filter);

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Customer Reviews</h2>
        
        <div className="flex items-start gap-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold dark:text-white">{averageRating.toFixed(1)}</div>
            <StarRating rating={averageRating} size="lg" />
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {totalReviews} reviews
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <button
                  key={star}
                  onClick={() => setFilter(filter === star ? 'all' : star)}
                  className="flex items-center gap-2 w-full hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                >
                  <span className="text-sm font-medium dark:text-gray-300">{star}</span>
                  <FiStar className="text-yellow-400 fill-current" size={16} />
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Write a Review
        </button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm 
          productId={productId} 
          onClose={() => setShowReviewForm(false)} 
        />
      )}

      {/* Filter Info */}
      {filter !== 'all' && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <span className="text-sm dark:text-gray-300">
            Showing {filteredReviews.length} {filter}-star reviews
          </span>
          <button
            onClick={() => setFilter('all')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [helpful, setHelpful] = useState(review.helpful);
  const [hasVoted, setHasVoted] = useState(false);

  const handleHelpful = () => {
    if (!hasVoted) {
      setHelpful(helpful + 1);
      setHasVoted(true);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold dark:text-white">{review.userName}</span>
            {review.verified && (
              <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                <FiCheck size={12} />
                Verified Purchase
              </span>
            )}
          </div>
          <StarRating rating={review.rating} size="sm" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>

      <h3 className="font-semibold mb-2 dark:text-white">{review.title}</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">{review.comment}</p>

      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4">
          {review.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Review image ${idx + 1}`}
              className="w-20 h-20 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={handleHelpful}
          disabled={hasVoted}
          className={`flex items-center gap-1 ${
            hasVoted 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          } transition-colors`}
        >
          <FiThumbsUp size={16} />
          Helpful ({helpful})
        </button>
      </div>
    </div>
  );
}

function ReviewForm({ productId, onClose }: { productId: string; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to API
    console.log({ productId, rating, title, comment });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4 dark:text-white">Write Your Review</h3>

      {/* Rating Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 dark:text-gray-300">
          Your Rating *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-3xl transition-colors"
            >
              <FiStar
                className={
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 dark:text-gray-300">
          Review Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 dark:text-gray-300">
          Your Review *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={rating === 0}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Submit Review
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Star Rating Display Component
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-0.5 ${sizeClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={
            star <= Math.round(rating)
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300 dark:text-gray-600'
          }
        />
      ))}
    </div>
  );
}

export { StarRating };
