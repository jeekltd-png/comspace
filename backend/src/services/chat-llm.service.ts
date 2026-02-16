/**
 * Chat LLM Service — provider-agnostic gateway.
 *
 * Supports OpenAI and Anthropic via a unified interface.
 * When neither key is configured the service returns a helpful
 * "not configured" message so the app still works in dev/demo mode.
 */
import { logger } from '../utils/logger';

// ── Types ────────────────────────────────────────────────────

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

type Provider = 'openai' | 'anthropic' | 'demo';

// ── Provider detection ───────────────────────────────────────

function detectProvider(): Provider {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'demo';
}

// ── OpenAI adapter ───────────────────────────────────────────

async function callOpenAI(
  messages: LLMMessage[],
  tools: ToolDefinition[],
  systemPrompt: string,
): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

  const openAIMessages: Array<Record<string, unknown>> = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const body: Record<string, unknown> = {
    model,
    messages: openAIMessages,
    temperature: 0.4,
    max_tokens: 1024,
  };

  if (tools.length > 0) {
    body.tools = tools.map(t => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }));
    body.tool_choice = 'auto';
  }

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    logger.error(`OpenAI API error: ${resp.status} – ${errText}`);
    throw new Error('LLM provider error');
  }

  const data = (await resp.json()) as any;
  const choice = data.choices?.[0];
  const msg = choice?.message;

  const toolCalls: ToolCall[] = (msg?.tool_calls ?? []).map((tc: any) => ({
    name: tc.function.name,
    args: JSON.parse(tc.function.arguments || '{}'),
  }));

  return {
    content: msg?.content ?? '',
    toolCalls,
    finishReason: toolCalls.length > 0 ? 'tool_calls' : (choice?.finish_reason ?? 'stop'),
  };
}

// ── Anthropic adapter ────────────────────────────────────────

async function callAnthropic(
  messages: LLMMessage[],
  tools: ToolDefinition[],
  systemPrompt: string,
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const model = process.env.ANTHROPIC_CHAT_MODEL || 'claude-sonnet-4-20250514';

  const anthropicMessages = messages.map(m => ({ role: m.role, content: m.content }));

  const body: Record<string, unknown> = {
    model,
    system: systemPrompt,
    messages: anthropicMessages,
    max_tokens: 1024,
    temperature: 0.4,
  };

  if (tools.length > 0) {
    body.tools = tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    logger.error(`Anthropic API error: ${resp.status} – ${errText}`);
    throw new Error('LLM provider error');
  }

  const data = (await resp.json()) as any;

  const toolCalls: ToolCall[] = (data.content ?? [])
    .filter((block: any) => block.type === 'tool_use')
    .map((block: any) => ({ name: block.name, args: block.input ?? {} }));

  const text = (data.content ?? [])
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('');

  return {
    content: text,
    toolCalls,
    finishReason: toolCalls.length > 0 ? 'tool_calls' : (data.stop_reason === 'end_turn' ? 'stop' : 'stop'),
  };
}

// ── Demo fallback ────────────────────────────────────────────

function demoResponse(messages: LLMMessage[]): LLMResponse {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() ?? '';

  if (lastMsg.includes('order') || lastMsg.includes('track')) {
    return {
      content:
        'I can help you track your order! Please share your order number (e.g. ORD-XXXXXX) and I\'ll look it up for you.',
      toolCalls: [],
      finishReason: 'stop',
    };
  }
  if (lastMsg.includes('return') || lastMsg.includes('refund')) {
    return {
      content:
        'For returns and refunds, please go to **My Orders**, click the order, and select "Request Return". Our team will process it within 2-3 business days.',
      toolCalls: [],
      finishReason: 'stop',
    };
  }
  if (lastMsg.includes('product') || lastMsg.includes('find') || lastMsg.includes('search')) {
    return {
      content:
        "I'd be happy to help you find products! What are you looking for? You can tell me a category, price range, or any keywords.",
      toolCalls: [],
      finishReason: 'stop',
    };
  }

  return {
    content:
      "Hello! I'm the store assistant. I can help you with:\n\n• 🔍 **Finding products**\n• 📦 **Tracking orders**\n• 🔄 **Returns & refunds**\n• ❓ **General questions**\n\nWhat can I help you with today?",
    toolCalls: [],
    finishReason: 'stop',
  };
}

// ── Public API ───────────────────────────────────────────────

export async function chatCompletion(
  messages: LLMMessage[],
  tools: ToolDefinition[],
  systemPrompt: string,
): Promise<LLMResponse> {
  const provider = detectProvider();

  logger.info(`Chat LLM provider: ${provider}`);

  switch (provider) {
    case 'openai':
      return callOpenAI(messages, tools, systemPrompt);
    case 'anthropic':
      return callAnthropic(messages, tools, systemPrompt);
    case 'demo':
    default:
      return demoResponse(messages);
  }
}
