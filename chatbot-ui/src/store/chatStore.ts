import { create } from 'zustand';
import type { ChatMessage } from '../types/chat.types';
import type { Agent, AgentExecuteRequest } from '../types/agent.types';
import agentsApi from '../api/agents.api';
import { handleApiError } from '../utils/errorHandler';
import {
  generateSecureId,
  validateMessage,
  isValidAgentId,
  RateLimiter
} from '../utils/security';
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  trimMessages,
  sanitizeMessageForStorage
} from '../utils/storage';
import toast from 'react-hot-toast';

interface ChatStore {
  messages: ChatMessage[];
  currentAgent: Agent | null;
  isExecuting: boolean;
  error: string | null;
  useStreaming: boolean; // Toggle between streaming and non-streaming

  sendMessage: (query: string) => Promise<void>;
  sendMessageStreaming: (query: string) => Promise<void>;
  setAgent: (agent: Agent) => void;
  clearMessages: () => void;
  loadHistory: (agentId: string) => void;
  saveHistory: () => void;
  clearError: () => void;
  toggleStreaming: () => void;
}

const STORAGE_KEY_PREFIX = 'chat_history_';
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Validator for chat messages
const isChatMessageArray = (data: unknown): data is ChatMessage[] => {
  if (!Array.isArray(data)) return false;
  return data.every(
    (msg) =>
      typeof msg === 'object' &&
      msg !== null &&
      'id' in msg &&
      'role' in msg &&
      'content' in msg &&
      'timestamp' in msg
  );
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  currentAgent: null,
  isExecuting: false,
  error: null,
  useStreaming: true, // Default to streaming for better UX

  sendMessage: async (query: string) => {
    const { useStreaming } = get();

    // Use streaming or non-streaming based on toggle
    if (useStreaming) {
      return get().sendMessageStreaming(query);
    }

    // Original non-streaming implementation
    const { currentAgent, messages } = get();

    // Validate agent
    if (!currentAgent) {
      toast.error('Please select an agent first');
      return;
    }

    // Validate agent ID
    if (!isValidAgentId(currentAgent.agent_id)) {
      toast.error('Invalid agent configuration');
      return;
    }

    // Validate and sanitize message
    const validation = validateMessage(query);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid message');
      return;
    }

    // Rate limiting check
    if (!rateLimiter.canMakeRequest()) {
      toast.error('Too many requests. Please wait a moment before trying again.');
      return;
    }

    // Add user message with secure ID and sanitized content
    const userMessage: ChatMessage = {
      id: generateSecureId(),
      role: 'user',
      content: validation.sanitized,
      timestamp: new Date(),
    };

    set({ messages: [...messages, userMessage], isExecuting: true, error: null });

    try {
      const request: AgentExecuteRequest = {
        agent_id: currentAgent.agent_id,
        query: validation.sanitized,
      };

      const response = await agentsApi.execute(request);

      // Add assistant message with secure ID
      const assistantMessage: ChatMessage = {
        id: generateSecureId(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        contextDocuments: response.context_documents || undefined,
        executionTimeMs: response.execution_time_ms,
      };

      set((state) => ({
        messages: trimMessages([...state.messages, assistantMessage]),
        isExecuting: false,
      }));

      // Save to localStorage
      get().saveHistory();
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isExecuting: false });
      toast.error(errorMessage);

      // Add error message with secure ID
      const errorMsg: ChatMessage = {
        id: generateSecureId(),
        role: 'system',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };

      set((state) => ({ messages: [...state.messages, errorMsg] }));
    }
  },

  sendMessageStreaming: async (query: string) => {
    const { currentAgent, messages } = get();

    // Validate agent
    if (!currentAgent) {
      toast.error('Please select an agent first');
      return;
    }

    // Validate agent ID
    if (!isValidAgentId(currentAgent.agent_id)) {
      toast.error('Invalid agent configuration');
      return;
    }

    // Validate and sanitize message
    const validation = validateMessage(query);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid message');
      return;
    }

    // Rate limiting check
    if (!rateLimiter.canMakeRequest()) {
      toast.error('Too many requests. Please wait a moment before trying again.');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: generateSecureId(),
      role: 'user',
      content: validation.sanitized,
      timestamp: new Date(),
    };

    set({ messages: [...messages, userMessage], isExecuting: true, error: null });

    // Create placeholder assistant message
    const assistantMessageId = generateSecureId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '', // Will be filled as chunks arrive
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, assistantMessage],
    }));

    let accumulatedContent = '';
    let contextDocuments: any[] | undefined;
    let executionTimeMs: number | undefined;

    try {
      const request: AgentExecuteRequest = {
        agent_id: currentAgent.agent_id,
        query: validation.sanitized,
      };

      await agentsApi.executeStream(request, {
        onMetadata: (data) => {
          // Optional: Could show agent name or RAG status
          console.log('Agent metadata:', data);
        },

        onContext: (data) => {
          // Store context documents to add to message later
          contextDocuments = data.documents;

          // Update message with context
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, contextDocuments: data.documents }
                : msg
            ),
          }));
        },

        onContent: (content) => {
          // Accumulate content and update message in real-time
          accumulatedContent += content;

          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            ),
          }));
        },

        onDone: (data) => {
          // Store execution time
          executionTimeMs = data.execution_time_ms;

          // Final update with execution time
          set((state) => ({
            messages: trimMessages(
              state.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, executionTimeMs: data.execution_time_ms }
                  : msg
              )
            ),
            isExecuting: false,
          }));

          // Save to localStorage
          get().saveHistory();
        },

        onError: (error) => {
          const errorMessage = `Streaming error: ${error}`;
          set({ error: errorMessage, isExecuting: false });
          toast.error(errorMessage);

          // Replace assistant message with error message
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    role: 'system' as const,
                    content: `Error: ${error}`,
                  }
                : msg
            ),
          }));
        },
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isExecuting: false });
      toast.error(errorMessage);

      // Replace assistant message with error message
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                role: 'system' as const,
                content: `Error: ${errorMessage}`,
              }
            : msg
        ),
      }));
    }
  },

  setAgent: (agent: Agent) => {
    set({ currentAgent: agent, messages: [] });
    // Load history for this agent
    get().loadHistory(agent.agent_id);
  },

  clearMessages: () => {
    const { currentAgent } = get();
    set({ messages: [] });

    // Clear from localStorage using safe method
    if (currentAgent && isValidAgentId(currentAgent.agent_id)) {
      safeRemoveItem(`${STORAGE_KEY_PREFIX}${currentAgent.agent_id}`);
    }
  },

  loadHistory: (agentId: string) => {
    // Validate agent ID before loading
    if (!isValidAgentId(agentId)) {
      console.warn('Invalid agent ID, skipping history load');
      return;
    }

    const stored = safeGetItem<ChatMessage[]>(
      `${STORAGE_KEY_PREFIX}${agentId}`,
      isChatMessageArray
    );

    if (stored && Array.isArray(stored)) {
      // Convert timestamp strings back to Date objects and sanitize
      const parsedMessages = stored.map((msg) => ({
        ...sanitizeMessageForStorage(msg),
        timestamp: new Date(msg.timestamp),
      }));

      // Trim to max limit
      set({ messages: trimMessages(parsedMessages) });
    }
  },

  saveHistory: () => {
    const { currentAgent, messages } = get();
    if (!currentAgent || !isValidAgentId(currentAgent.agent_id)) {
      return;
    }

    if (messages.length > 0) {
      // Sanitize messages before saving
      const sanitizedMessages = messages.map(sanitizeMessageForStorage);

      // Trim to max limit before saving
      const trimmedMessages = trimMessages(sanitizedMessages);

      const success = safeSetItem(
        `${STORAGE_KEY_PREFIX}${currentAgent.agent_id}`,
        trimmedMessages
      );

      if (!success) {
        console.error('Failed to save chat history');
        toast.error('Failed to save chat history');
      }
    }
  },

  clearError: () => {
    set({ error: null });
  },

  toggleStreaming: () => {
    set((state) => ({ useStreaming: !state.useStreaming }));
    toast.success(`Streaming ${get().useStreaming ? 'enabled' : 'disabled'}`);
  },
}));
