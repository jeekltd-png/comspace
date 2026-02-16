import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/lib/api';

// ── Types ────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  timestamp: string;
}

interface ChatState {
  /** Unique session ID for this conversation */
  sessionId: string | null;
  messages: ChatMessage[];
  /** Is the assistant currently typing / waiting for LLM? */
  isTyping: boolean;
  /** Is the chat panel open? */
  isOpen: boolean;
  error: string | null;
}

const SESSION_KEY = 'comspace_chat_session';

function loadSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

function persistSessionId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, id);
  }
}

// ── Async thunks ─────────────────────────────────────────────

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    payload: { message: string; locale?: string; pageUrl?: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = (getState() as any).chat as ChatState;
      const resp = await apiClient.post('/chat/message', {
        message: payload.message,
        sessionId: state.sessionId,
        locale: payload.locale || 'en',
        pageUrl: payload.pageUrl,
      });

      const data = resp.data?.data;
      return {
        sessionId: data.sessionId as string,
        message: data.message as ChatMessage,
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to send message',
      );
    }
  },
);

export const loadChatHistory = createAsyncThunk(
  'chat/loadHistory',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as any).chat as ChatState;
      if (!state.sessionId) return { messages: [] };

      const resp = await apiClient.get('/chat/history', {
        params: { sessionId: state.sessionId },
      });
      return { messages: (resp.data?.data?.messages ?? []) as ChatMessage[] };
    } catch (err: any) {
      return rejectWithValue('Failed to load history');
    }
  },
);

// ── Slice ────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    sessionId: null,
    messages: [],
    isTyping: false,
    isOpen: false,
    error: null,
  } as ChatState,

  reducers: {
    toggleChat(state) {
      state.isOpen = !state.isOpen;
    },
    openChat(state) {
      state.isOpen = true;
    },
    closeChat(state) {
      state.isOpen = false;
    },
    /** Add an optimistic user message before the API responds */
    addUserMessage(state, action: PayloadAction<string>) {
      state.messages.push({
        role: 'user',
        content: action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    hydrateSession(state) {
      const stored = loadSessionId();
      if (stored) state.sessionId = stored;
    },
    clearChat(state) {
      state.messages = [];
      state.sessionId = null;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
      }
    },
  },

  extraReducers: (builder) => {
    // sendChatMessage
    builder.addCase(sendChatMessage.pending, (state) => {
      state.isTyping = true;
      state.error = null;
    });
    builder.addCase(sendChatMessage.fulfilled, (state, action) => {
      state.isTyping = false;
      const { sessionId, message } = action.payload;
      state.sessionId = sessionId;
      persistSessionId(sessionId);
      state.messages.push({
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
      });
    });
    builder.addCase(sendChatMessage.rejected, (state, action) => {
      state.isTyping = false;
      state.error = (action.payload as string) || 'Something went wrong';
    });

    // loadChatHistory
    builder.addCase(loadChatHistory.fulfilled, (state, action) => {
      if (action.payload.messages.length > 0) {
        state.messages = action.payload.messages;
      }
    });
  },
});

export const { toggleChat, openChat, closeChat, addUserMessage, hydrateSession, clearChat } =
  chatSlice.actions;

export default chatSlice.reducer;
