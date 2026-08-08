import { AgentTool } from '@/agents/agent-tool';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: ChatRole;
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface LlmResponse {
  content: string | null;
  toolCalls: ToolCall[];
  model: string;
}

export interface ToolExecutionResult {
  ok: boolean;
  status: number;
  data: unknown;
}

export interface AgentContext {
  baseUrl: string;
  authHeaderName?: string | null;
  authHeaderValue?: string | null;
  tools: AgentTool[];
  model: string;
  fallbackModel?: string;
  pendingMutations?: ToolCall[];
}
