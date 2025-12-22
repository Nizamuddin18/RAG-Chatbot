import { create } from 'zustand';
import type { Agent, AgentCreate, AgentUpdate } from '../types/agent.types';
import agentsApi from '../api/agents.api';
import { handleApiError } from '../utils/errorHandler';
import toast from 'react-hot-toast';

interface AgentStore {
  agents: Agent[];
  selectedAgent: Agent | null;
  isLoading: boolean;
  error: string | null;

  fetchAgents: () => Promise<void>;
  createAgent: (data: AgentCreate) => Promise<Agent | null>;
  updateAgent: (id: string, data: AgentUpdate) => Promise<Agent | null>;
  deleteAgent: (id: string) => Promise<boolean>;
  setSelectedAgent: (agent: Agent | null) => void;
  clearError: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  selectedAgent: null,
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await agentsApi.getAll();
      set({ agents: data.agents, isLoading: false });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  createAgent: async (data: AgentCreate) => {
    set({ isLoading: true, error: null });
    try {
      const newAgent = await agentsApi.create(data);
      set((state) => ({
        agents: [...state.agents, newAgent],
        isLoading: false,
      }));
      toast.success('Agent created successfully');
      return newAgent;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  updateAgent: async (id: string, data: AgentUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const updatedAgent = await agentsApi.update(id, data);
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.agent_id === id ? updatedAgent : agent
        ),
        selectedAgent:
          state.selectedAgent?.agent_id === id
            ? updatedAgent
            : state.selectedAgent,
        isLoading: false,
      }));
      toast.success('Agent updated successfully');
      return updatedAgent;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  deleteAgent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await agentsApi.delete(id);
      set((state) => ({
        agents: state.agents.filter((agent) => agent.agent_id !== id),
        selectedAgent:
          state.selectedAgent?.agent_id === id ? null : state.selectedAgent,
        isLoading: false,
      }));
      toast.success('Agent deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      return false;
    }
  },

  setSelectedAgent: (agent: Agent | null) => {
    set({ selectedAgent: agent });
  },

  clearError: () => {
    set({ error: null });
  },
}));
