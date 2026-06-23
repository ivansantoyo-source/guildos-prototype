import type { StateCreator } from 'zustand';
import type { AgentSession, AgentMessage, AIToolCall } from '@/lib/types';
import type { GuildState } from '../storeTypes';

export interface AgentSlice {
  agentSession: AgentSession | null;
  agentMessages: AgentMessage[];
  setAgentSession: (session: AgentSession | null) => void;
  addAgentMessage: (message: AgentMessage) => void;
  updateAgentMessage: (id: string, updates: Partial<AgentMessage>) => void;
  addAgentToolCall: (messageId: string, toolCall: AIToolCall) => void;
  updateAgentToolCall: (messageId: string, toolCallId: string, updates: Partial<AIToolCall>) => void;
  clearAgentSession: () => void;
}

export const createAgentSlice: StateCreator<GuildState, [], [], AgentSlice> = (set) => ({
  agentSession: null,
  agentMessages: [],

  setAgentSession: (session) => set({ agentSession: session }),
  addAgentMessage: (message) =>
    set((state) => ({
      agentMessages: [...state.agentMessages, message],
    })),
  updateAgentMessage: (id, updates) =>
    set((state) => ({
      agentMessages: state.agentMessages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  addAgentToolCall: (messageId, toolCall) =>
    set((state) => ({
      agentMessages: state.agentMessages.map((m) =>
        m.id === messageId
          ? { ...m, tool_calls: [...(m.tool_calls || []), toolCall] }
          : m
      ),
    })),
  updateAgentToolCall: (messageId, toolCallId, updates) =>
    set((state) => ({
      agentMessages: state.agentMessages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              tool_calls: (m.tool_calls || []).map((tc) =>
                tc.id === toolCallId ? { ...tc, ...updates } : tc
              ),
            }
          : m
      ),
    })),
  clearAgentSession: () => set({ agentSession: null, agentMessages: [] }),
});
