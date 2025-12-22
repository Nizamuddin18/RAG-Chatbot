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

  // Execute agent with query
  execute: async (request: AgentExecuteRequest): Promise<AgentExecuteResponse> => {
    const response = await apiClient.post<AgentExecuteResponse>('/agents/execute', request);
    return response.data;
  },
};

export default agentsApi;
