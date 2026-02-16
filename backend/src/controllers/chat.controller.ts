/**
 * Chat Controller — handles chat message exchange.
 *
 * POST /api/chat/message   – send a user message, get assistant reply
 * GET  /api/chat/history    – retrieve conversation history
 * POST /api/chat/close      – close / archive a conversation
 */
import { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ChatConversation, { IChatMessage } from '../models/chat-message.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomError } from '../middleware/error.middleware';
import { chatCompletion, type LLMMessage } from '../services/chat-llm.service';
import { CHAT_TOOLS, executeTool } from '../services/chat-tools';
import { logger } from '../utils/logger';

// ── Helpers ──────────────────────────────────────────────────

const MAX_CONTEXT_MESSAGES = 20; // Last N messages sent to the LLM

function buildSystemPrompt(tenantName: string, locale: string): string {
  return `You are a friendly, professional e-commerce assistant for "${tenantName}".
Your job is to help customers find products, track orders, answer policy questions, and provide a great experience.

Guidelines:
- Be concise and helpful. Use markdown formatting when it improves readability.
- If you can answer using a tool, prefer using it over guessing.
- Always respect the customer's locale (${locale}). Respond in the same language the customer writes in.
- Never reveal internal system details, API keys, or database structure.
- If you cannot help, suggest the customer contact support.
- When showing products, include the name, price, and a brief description.
- When showing order status, include the order number, current status, and estimated delivery if available.
- Proactively offer helpful follow-up suggestions.`;
}

function buildSuggestions(intent: string): string[] {
  switch (intent) {
    case 'greeting':
      return ['Browse products', 'Track my order', 'Shipping info'];
    case 'product_search':
      return ['Show more results', 'Filter by price', 'View details'];
    case 'order_status':
      return ['Track another order', 'Request return', 'Contact support'];
    case 'faq':
      return ['Shipping policy', 'Returns policy', 'Payment methods'];
    default:
      return ['Browse products', 'Track order', 'Help'];
  }
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase();
  if (/^(hi|hello|hey|good\s?(morning|afternoon|evening))/.test(lower)) return 'greeting';
  if (/order|track|status|where.*(my|is)|delivery/.test(lower)) return 'order_status';
  if (/return|refund|exchange|cancel/.test(lower)) return 'return';
  if (/ship|deliver|how\s?long/.test(lower)) return 'faq';
  if (/pay|payment|card|stripe|wallet/.test(lower)) return 'faq';
  if (/privacy|data|gdpr|cookie/.test(lower)) return 'faq';
  if (/product|find|search|looking|recommend|suggest|buy|price/.test(lower)) return 'product_search';
  return 'general';
}

// ── POST /api/chat/message ───────────────────────────────────

export const sendMessage: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { message, sessionId: clientSessionId, locale = 'en', pageUrl } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return next(new CustomError('Message is required', 400));
    }
    if (message.length > 2000) {
      return next(new CustomError('Message too long (max 2000 chars)', 400));
    }

    const tenant = authReq.tenant || 'default';
    const userId = authReq.user?._id?.toString();
    const sessionId = clientSessionId || uuidv4();

    // Find or create conversation
    let conversation = await ChatConversation.findOne({
      tenant,
      sessionId,
      closedAt: { $exists: false },
    });

    if (!conversation) {
      conversation = new ChatConversation({
        user: userId || undefined,
        sessionId,
        tenant,
        messages: [],
        locale,
        meta: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          pageUrl,
        },
      });
    }

    // Append user message
    const userMessage: IChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    // Detect intent
    const intent = detectIntent(message);
    conversation.lastIntent = intent;

    // Build LLM context (last N messages)
    const contextMessages: LLMMessage[] = conversation.messages
      .slice(-MAX_CONTEXT_MESSAGES)
      .map(m => ({ role: m.role, content: m.content }));

    // Tenant name for system prompt
    const tenantName = tenant === 'default' ? 'our store' : tenant;
    const systemPrompt = buildSystemPrompt(tenantName, locale);

    // Call LLM
    let llmResponse = await chatCompletion(contextMessages, CHAT_TOOLS, systemPrompt);

    // Execute tool calls if any (single round)
    const toolResults: Array<{ name: string; args: Record<string, unknown>; result: unknown }> = [];

    if (llmResponse.finishReason === 'tool_calls' && llmResponse.toolCalls.length > 0) {
      for (const tc of llmResponse.toolCalls) {
        try {
          const result = await executeTool(tc.name, tc.args, { tenant, userId });
          toolResults.push({ name: tc.name, args: tc.args, result });
        } catch (err) {
          logger.error(`Tool execution error: ${tc.name}`, err);
          toolResults.push({ name: tc.name, args: tc.args, result: { error: 'Tool execution failed' } });
        }
      }

      // Send tool results back to LLM for final answer
      const toolContext = toolResults
        .map(tr => `[Tool: ${tr.name}]\n${JSON.stringify(tr.result, null, 2)}`)
        .join('\n\n');

      contextMessages.push({
        role: 'assistant',
        content: llmResponse.content || 'Let me look that up for you.',
      });
      contextMessages.push({
        role: 'user',
        content: `Here are the results from the tools I used:\n\n${toolContext}\n\nPlease summarise this information in a helpful, natural way for the customer.`,
      });

      llmResponse = await chatCompletion(contextMessages, [], systemPrompt);
    }

    // Build assistant message
    const suggestions = buildSuggestions(intent);
    const assistantMessage: IChatMessage = {
      role: 'assistant',
      content: llmResponse.content,
      toolCalls: toolResults.length > 0 ? toolResults : undefined,
      suggestions,
      timestamp: new Date(),
    };
    conversation.messages.push(assistantMessage);

    await conversation.save();

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        message: {
          role: 'assistant',
          content: llmResponse.content,
          suggestions,
          toolCalls: toolResults.map(tr => ({ name: tr.name, result: tr.result })),
        },
      },
    });
  } catch (err) {
    logger.error('Chat sendMessage error', err);
    next(err);
  }
};

// ── GET /api/chat/history ────────────────────────────────────

export const getHistory: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { sessionId } = req.query;
    if (!sessionId || typeof sessionId !== 'string') {
      return next(new CustomError('sessionId query param is required', 400));
    }

    const tenant = authReq.tenant || 'default';

    const conversation = await ChatConversation.findOne({
      tenant,
      sessionId,
      closedAt: { $exists: false },
    }).lean();

    if (!conversation) {
      return res.status(200).json({ success: true, data: { messages: [] } });
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId,
        messages: conversation.messages.map(m => ({
          role: m.role,
          content: m.content,
          suggestions: m.suggestions,
          timestamp: m.timestamp,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/chat/close ─────────────────────────────────────

export const closeConversation: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthRequest;
  try {
    const { sessionId } = req.body;
    if (!sessionId) return next(new CustomError('sessionId is required', 400));

    const tenant = authReq.tenant || 'default';

    const conversation = await ChatConversation.findOneAndUpdate(
      { tenant, sessionId, closedAt: { $exists: false } },
      { closedAt: new Date() },
      { new: true },
    );

    if (!conversation) {
      return next(new CustomError('Conversation not found', 404));
    }

    res.status(200).json({ success: true, data: { closed: true } });
  } catch (err) {
    next(err);
  }
};
