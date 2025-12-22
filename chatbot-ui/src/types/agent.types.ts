export interface Agent {
  agent_id: string;
  name: string;
  system_instruction: string;
  index_name: string | null;
  temperature: number;
  max_tokens: number | null;
  created_at: string;
  updated_at: string;
}

export interface AgentCreate {
  name: string;
  system_instruction: string;
  index_name?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface AgentUpdate {
  name?: string;
  system_instruction?: string;
  index_name?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface AgentList {
  agents: Agent[];
  total: number;
}

export interface AgentExecuteRequest {
  query: string;
  agent_id: string;
}

export interface ContextDocument {
  content: string;
  metadata: Record<string, any>;
}

export interface AgentExecuteResponse {
  agent_id: string;
  query: string;
  answer: string;
  context_documents: ContextDocument[] | null;
  execution_time_ms: number;
}
