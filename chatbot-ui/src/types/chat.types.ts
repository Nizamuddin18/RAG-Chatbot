import type { ContextDocument } from './agent.types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  contextDocuments?: ContextDocument[];
  executionTimeMs?: number;
}

export interface ChatHistory {
  agentId: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}
