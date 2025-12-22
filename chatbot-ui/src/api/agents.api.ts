import apiClient from './client';
import type {
  Agent,
  AgentCreate,
  AgentUpdate,
  AgentList,
  AgentExecuteRequest,
  AgentExecuteResponse,
} from '../types/agent.types';
import type { MessageResponse } from '../types/common.types';

export const agentsApi = {
  // Get all agents
  getAll: async (): Promise<AgentList> => {
    const response = await apiClient.get<AgentList>('/agents/');
    return response.data;
  },

  // Get agent by ID
  getById: async (id: string): Promise<Agent> => {
    const response = await apiClient.get<Agent>(`/agents/${id}`);
    return response.data;
  },

  // Create new agent
  create: async (data: AgentCreate): Promise<Agent> => {
    const response = await apiClient.post<Agent>('/agents/', data);
    return response.data;
  },

  // Update agent
  update: async (id: string, data: AgentUpdate): Promise<Agent> => {
    const response = await apiClient.put<Agent>(`/agents/${id}`, data);
    return response.data;
  },

  // Delete agent
  delete: async (id: string): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/agents/${id}`);
    return response.data;
  },

  // Execute agent with query (non-streaming)
  execute: async (request: AgentExecuteRequest): Promise<AgentExecuteResponse> => {
    const response = await apiClient.post<AgentExecuteResponse>('/agents/execute', request);
    return response.data;
  },

  // Execute agent with streaming response (NEW)
  executeStream: async (
    request: AgentExecuteRequest,
    callbacks: {
      onMetadata?: (data: { agent_id: string; agent_name: string; has_rag: boolean }) => void;
      onContext?: (data: { documents: any[] }) => void;
      onContent?: (content: string) => void;
      onDone?: (data: { execution_time_ms: number }) => void;
      onError?: (error: string) => void;
    }
  ): Promise<void> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const url = `${baseUrl}/agents/execute/stream`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const jsonData = line.slice(6); // Remove 'data: ' prefix
            const eventData = JSON.parse(jsonData);

            // Handle different event types
            switch (eventData.type) {
              case 'metadata':
                callbacks.onMetadata?.({
                  agent_id: eventData.agent_id,
                  agent_name: eventData.agent_name,
                  has_rag: eventData.has_rag,
                });
                break;

              case 'context':
                callbacks.onContext?.({
                  documents: eventData.documents,
                });
                break;

              case 'content':
                callbacks.onContent?.(eventData.content);
                break;

              case 'done':
                callbacks.onDone?.({
                  execution_time_ms: eventData.execution_time_ms,
                });
                break;

              case 'error':
                callbacks.onError?.(eventData.error);
                break;
            }
          } catch (parseError) {
            console.error('Error parsing SSE event:', parseError, line);
          }
        }
      }

      reader.releaseLock();
    } catch (error) {
      console.error('Stream error:', error);
      callbacks.onError?.(error instanceof Error ? error.message : 'Streaming failed');
      throw error;
    }
  },
};

export default agentsApi;
