import React from 'react';

type BadgeType = 'new' | 'sale' | 'hot' | 'limited' | 'bestseller' | 'featured';

interface ProductBadgeProps {
  type: BadgeType;
  discount?: number;
  className?: string;
}

const badgeStyles: Record<BadgeType, { bg: string; text: string; icon?: string }> = {
  new: { bg: 'bg-brand-500', text: 'text-white', icon: '✨' },
  sale: { bg: 'bg-red-500', text: 'text-white', icon: '🔥' },
  hot: { bg: 'bg-orange-500', text: 'text-white', icon: '🔥' },
  limited: { bg: 'bg-purple-500', text: 'text-white', icon: '⚡' },
  bestseller: { bg: 'bg-green-500', text: 'text-white', icon: '⭐' },
  featured: { bg: 'bg-yellow-500', text: 'text-gray-900', icon: '👑' },
};

export default function ProductBadge({ type, discount, className = '' }: ProductBadgeProps) {
  const style = badgeStyles[type];
  
  const label = type === 'sale' && discount 
    ? `${discount}% OFF`
    : type.toUpperCase();

  return (
    <span 
      className={`absolute top-2 left-2 ${style.bg} ${style.text} px-2 py-1 rounded-md text-xs font-bold shadow-lg z-10 flex items-center gap-1 ${className}`}
    >
      {style.icon && <span>{style.icon}</span>}
      {label}
    </span>
  );
}

// Multiple badges component
interface ProductBadgesProps {
  badges: Array<{ type: BadgeType; discount?: number }>;
  className?: string;
}

export function ProductBadges({ badges, className = '' }: ProductBadgesProps) {
  if (badges.length === 0) return null;

  return (
    <div className={`absolute top-2 left-2 flex flex-col gap-1 z-10 ${className}`}>
      {badges.map((badge, index) => (
        <ProductBadge key={index} type={badge.type} discount={badge.discount} className="relative top-0 left-0" />
      ))}
    </div>
  );
}
