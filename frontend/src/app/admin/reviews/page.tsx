'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';

interface Review {
  _id: string;
  productId: { _id: string; name: string } | string;
  userId: { _id: string; name: string; email: string } | string;
  tenant: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (filter === 'verified') params.set('verified', 'true');
      if (filter === 'unverified') params.set('verified', 'false');
      if (ratingFilter) params.set('rating', String(ratingFilter));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reviews?${params}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || data.data || []);
        setTotal(data.total || data.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reviews/${id}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
        setTotal((t) => t - 1);
      }
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Moderation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} reviews total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'verified', 'unverified'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-surface-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <select
            value={ratingFilter ?? ''}
            onChange={(e) => { setRatingFilter(e.target.value ? Number(e.target.value) : null); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-300 border-0"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 rounded-xl p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No reviews found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const product = typeof review.productId === 'object' ? review.productId : null;
            const reviewer = typeof review.userId === 'object' ? review.userId : null;
            return (
              <div
                key={review._id}
                className="bg-white dark:bg-surface-900 rounded-xl p-4 border border-gray-200 dark:border-surface-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-yellow-500 text-sm tracking-wide">{stars(review.rating)}</span>
                      {review.verified && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                          ✓ Verified Purchase
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {review.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {review.comment}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {reviewer && <span>By: {reviewer.name || reviewer.email}</span>}
                      {product && <span>Product: {product.name}</span>}
                      <span>👍 {review.helpful}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReview(review._id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-surface-800 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-surface-800 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
