'use client';

import dynamic from 'next/dynamic';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

/**
 * Lazy-loaded, feature-flag-gated wrapper for the ChatWidget.
 *
 * • Only renders when the tenant has `chat: true` in their white-label config.
 * • Code-splits ChatWidget so the ~10KB bundle is never loaded for tenants
 *   that don't use chat.
 */
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), {
  ssr: false,
});

export default function ChatGate() {
  const chatEnabled = useFeatureFlag('chat');

  if (!chatEnabled) return null;

  return <ChatWidget />;
}
