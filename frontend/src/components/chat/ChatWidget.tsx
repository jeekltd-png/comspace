'use client';

import React, { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  toggleChat,
  closeChat,
  addUserMessage,
  sendChatMessage,
  loadChatHistory,
  hydrateSession,
  clearChat,
  type ChatMessage,
} from '@/store/slices/chatSlice';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';

// ── Icons (inline SVGs to avoid extra deps) ──────────────────

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
      <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
    </svg>
  );
}

function MinimiseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903H14.25a.75.75 0 000 1.5h6a.75.75 0 00.75-.75v-6a.75.75 0 00-1.5 0v3.068l-1.968-1.968A9 9 0 013.292 9.57a.75.75 0 001.463.488zM19.245 13.941a7.5 7.5 0 01-12.548 3.364l-1.903-1.903H9.75a.75.75 0 000-1.5h-6a.75.75 0 00-.75.75v6a.75.75 0 001.5 0v-3.068l1.968 1.968A9 9 0 0020.708 14.43a.75.75 0 00-1.463-.488z" clipRule="evenodd" />
    </svg>
  );
}

// ── Message Bubble ───────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-brand-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
        }`}
      >
        {/* Simple markdown-ish rendering: bold and bullet points */}
        {msg.content.split('\n').map((line, i) => {
          // Bold: **text**
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j}>{part}</strong>
                ) : (
                  <span key={j}>{part}</span>
                ),
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ── Quick Reply Chips ────────────────────────────────────────

function QuickReplies({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (text: string) => void;
}) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3 px-1">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className="text-xs px-3 py-1.5 rounded-full border border-brand-300 dark:border-brand-600 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Main ChatWidget ──────────────────────────────────────────

export default function ChatWidget() {
  const dispatch = useAppDispatch();
  const { isOpen, messages, isTyping, error } = useAppSelector((s) => s.chat);
  const { config } = useWhiteLabel();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);

  // Hydrate session on mount
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      dispatch(hydrateSession());
      dispatch(loadChatHistory());
    }
  }, [dispatch]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text || input).trim();
      if (!msg) return;

      dispatch(addUserMessage(msg));
      dispatch(
        sendChatMessage({
          message: msg,
          locale: typeof navigator !== 'undefined' ? navigator.language?.split('-')[0] : 'en',
          pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      );
      setInput('');
    },
    [input, dispatch],
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      handleSend();
    },
    [handleSend],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Get last assistant message suggestions
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const suggestions = lastAssistantMsg?.suggestions ?? [];

  const storeName = config?.name || 'Store';

  return (
    <>
      {/* ── FAB (Floating Action Button) ──────────────────── */}
      {!isOpen && (
        <button
          onClick={() => dispatch(toggleChat())}
          aria-label="Open chat assistant"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95"
        >
          <ChatIcon />
        </button>
      )}

      {/* ── Chat Panel ────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          role="dialog"
          aria-label="Chat assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {storeName[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{storeName} Assistant</h3>
                <p className="text-xs text-white/70">
                  {isTyping ? 'Typing…' : 'Online'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => dispatch(clearChat())}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="New conversation"
                title="New conversation"
              >
                <RefreshIcon />
              </button>
              <button
                onClick={() => dispatch(closeChat())}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Minimize chat"
                title="Minimize"
              >
                <MinimiseIcon />
              </button>
              <button
                onClick={() => dispatch(closeChat())}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close chat"
                title="Close"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.length === 0 && !isTyping && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4">
                  <ChatIcon />
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Hi there! 👋
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  How can I help you today?
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Browse products', 'Track my order', 'Shipping info'].map(
                    (chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSend(chip)}
                        className="text-xs px-3 py-1.5 rounded-full border border-brand-300 dark:border-brand-600 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
                      >
                        {chip}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {isTyping && <TypingIndicator />}

            {/* Quick reply chips from last assistant message */}
            {!isTyping && suggestions.length > 0 && (
              <QuickReplies
                suggestions={suggestions}
                onSelect={(text) => handleSend(text)}
              />
            )}

            {error && (
              <div className="text-xs text-red-500 text-center py-1">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={isTyping}
              maxLength={2000}
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 text-gray-900 dark:text-white placeholder-gray-400"
              aria-label="Chat message input"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
