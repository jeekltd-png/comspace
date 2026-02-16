import mongoose, { Schema, Document } from 'mongoose';

// ── Types ────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant' | 'system';

export interface IChatMessage {
  role: ChatRole;
  content: string;
  /** Tool calls the assistant made (e.g. searchProducts, getOrderStatus) */
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;
  /** Quick-reply suggestion chips surfaced alongside assistant messages */
  suggestions?: string[];
  timestamp: Date;
}

export interface IChatConversation extends Document {
  user?: mongoose.Types.ObjectId;
  /** Anonymous session id for guest users */
  sessionId: string;
  tenant: string;
  messages: IChatMessage[];
  /** Detected intent of the most recent user message */
  lastIntent?: string;
  /** ISO language code derived from the user's locale */
  locale?: string;
  /** Whether the conversation was escalated to a human */
  escalated: boolean;
  /** Metadata for analytics */
  meta: {
    userAgent?: string;
    ip?: string;
    pageUrl?: string;
  };
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ───────────────────────────────────────────────────

const ChatMessageSubSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true, maxlength: 4000 },
    toolCalls: [
      {
        name: String,
        args: Schema.Types.Mixed,
        result: Schema.Types.Mixed,
      },
    ],
    suggestions: [String],
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ChatConversationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String, required: true, index: true },
    tenant: { type: String, required: true, index: true },
    messages: {
      type: [ChatMessageSubSchema],
      validate: {
        validator: (v: IChatMessage[]) => v.length <= 200,
        message: 'Conversation cannot exceed 200 messages',
      },
    },
    lastIntent: String,
    locale: { type: String, default: 'en' },
    escalated: { type: Boolean, default: false },
    meta: {
      userAgent: String,
      ip: String,
      pageUrl: String,
    },
    closedAt: Date,
  },
  { timestamps: true },
);

// Compound index for efficient look-ups
ChatConversationSchema.index({ tenant: 1, sessionId: 1, updatedAt: -1 });

// Auto-expire closed conversations after 90 days
ChatConversationSchema.index({ closedAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export default mongoose.model<IChatConversation>(
  'ChatConversation',
  ChatConversationSchema,
);
