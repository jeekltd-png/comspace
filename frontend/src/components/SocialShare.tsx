'use client';

import React from 'react';
import { FiFacebook, FiTwitter, FiLinkedin, FiMail, FiLink } from 'react-icons/fi';
import { FaWhatsapp, FaPinterest } from 'react-icons/fa';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  hashtags?: string[];
  className?: string;
}

export default function SocialShare({ 
  url, 
  title, 
  description, 
  image, 
  hashtags = [],
  className = '' 
}: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');
  const hashtagString = hashtags.join(',');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${hashtagString ? `&hashtags=${hashtagString}` : ''}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${image || ''}&description=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Share:</span>
      
      <button
        onClick={() => openShareWindow(shareLinks.facebook)}
        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        aria-label="Share on Facebook"
      >
        <FiFacebook size={18} />
      </button>

      <button
        onClick={() => openShareWindow(shareLinks.twitter)}
        className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors"
        aria-label="Share on Twitter"
      >
        <FiTwitter size={18} />
      </button>

      <button
        onClick={() => openShareWindow(shareLinks.whatsapp)}
        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
        aria-label="Share on WhatsApp"
      >
        <FaWhatsapp size={18} />
      </button>

      <button
        onClick={() => openShareWindow(shareLinks.linkedin)}
        className="p-2 rounded-full bg-blue-700 text-white hover:bg-blue-800 transition-colors"
        aria-label="Share on LinkedIn"
      >
        <FiLinkedin size={18} />
      </button>

      {image && (
        <button
          onClick={() => openShareWindow(shareLinks.pinterest)}
          className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          aria-label="Share on Pinterest"
        >
          <FaPinterest size={18} />
        </button>
      )}

      <button
        onClick={() => openShareWindow(shareLinks.email)}
        className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors dark:bg-gray-500 dark:hover:bg-gray-600"
        aria-label="Share via Email"
      >
        <FiMail size={18} />
      </button>

      <button
        onClick={copyToClipboard}
        className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        aria-label="Copy link"
      >
        <FiLink size={18} />
      </button>
    </div>
  );
}

// Compact version for product cards
export function SocialShareCompact({ url, title }: Pick<SocialShareProps, 'url' | 'title'>) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-1">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        aria-label="Share on Facebook"
      >
        <FiFacebook size={14} />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors"
        aria-label="Share on Twitter"
      >
        <FiTwitter size={14} />
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
        aria-label="Share on WhatsApp"
      >
        <FaWhatsapp size={14} />
      </a>
    </div>
  );
}
