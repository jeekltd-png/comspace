import React from 'react';

interface StockCountdownProps {
  stock: number;
  threshold?: number;
  className?: string;
}

export default function StockCountdown({ 
  stock, 
  threshold = 10, 
  className = '' 
}: StockCountdownProps) {
  // Only show if stock is below threshold
  if (stock > threshold) {
    return null;
  }

  // Determine urgency level
  const getUrgencyStyle = () => {
    if (stock === 0) {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-300 dark:border-gray-600',
        message: 'Out of Stock',
      };
    }
    if (stock <= 3) {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-300 dark:border-red-600',
        message: `Only ${stock} left!`,
        icon: '🔥',
      };
    }
    if (stock <= 5) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-300 dark:border-orange-600',
        message: `Only ${stock} left!`,
        icon: '⚠️',
      };
    }
    return {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-300 dark:border-yellow-600',
      message: `${stock} left in stock`,
      icon: '⏰',
    };
  };

  const style = getUrgencyStyle();

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border
        ${style.bg} ${style.text} ${style.border}
        font-medium text-sm
        ${className}
      `}
    >
      {style.icon && <span className="text-base">{style.icon}</span>}
      <span>{style.message}</span>
    </div>
  );
}

// Compact version for product cards
export function StockCountdownCompact({ stock, threshold = 10 }: StockCountdownProps) {
  if (stock > threshold) return null;

  const isLowStock = stock <= 5;
  const isCritical = stock <= 3;

  return (
    <div className={`
      text-xs font-semibold
      ${stock === 0 ? 'text-gray-500 dark:text-gray-400' : ''}
      ${isLowStock && stock > 0 ? 'text-orange-600 dark:text-orange-400' : ''}
      ${isCritical ? 'text-red-600 dark:text-red-400' : ''}
    `}>
      {stock === 0 ? 'Out of Stock' : `Only ${stock} left!`}
    </div>
  );
}
