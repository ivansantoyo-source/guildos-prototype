"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { phantomAgentMessages } from "@/mocks/phantomData";
import type { AgentMessage, AIToolCall } from "@/lib/types";

// ============================================================================
// TYPES
// ============================================================================

type AgentStatus = "idle" | "thinking" | "streaming";

interface SSEEvent {
  type: "thinking" | "tool_call" | "tool_result" | "message" | "error" | "done";
  content?: string;
  toolCall?: AIToolCall;
  message?: AgentMessage;
  error?: string;
}

// ============================================================================
// SUGGESTED ACTIONS
// ============================================================================

const SUGGESTED_ACTIONS = [
  { label: "Check Inventory", prompt: "Show me what's in stock" },
  { label: "Active Bounties", prompt: "What are the current active bounties?" },
  { label: "Market Prices", prompt: "Check market prices for Chrono Trigger" },
  { label: "Store Stats", prompt: "How is the store performing?" },
  { label: "Recommendations", prompt: "Recommend some items for me" },
];

// ============================================================================
// TOOL STATUS ICON
// ============================================================================

function ToolStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pending":
    case "running":
      return (
        <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      );
    case "completed":
      return (
        <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    case "failed":
      return (
        <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================================
// TOOL CALL CARD
// ============================================================================

function ToolCallCard({ toolCall }: { toolCall: AIToolCall }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    pending: "border-yellow-500/40 bg-yellow-500/5",
    running: "border-blue-500/40 bg-blue-500/5",
    completed: "border-green-500/40 bg-green-500/5",
    failed: "border-red-500/40 bg-red-500/5",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    running: "Running...",
    completed: "Completed",
    failed: "Failed",
  };

  const borderColor = statusColors[toolCall.status] || statusColors.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-2 rounded-lg border ${borderColor} backdrop-blur-sm overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-left"
      >
        <ToolStatusIcon status={toolCall.status} />
        <span className="text-primary font-semibold">{toolCall.tool_name}</span>
        <span className="text-muted-foreground">— {statusLabels[toolCall.status]}</span>
        <span className="ml-auto text-muted-foreground">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 text-xs">
          <div>
            <span className="text-muted-foreground block mb-1">Parameters:</span>
            <pre className="bg-background/50 rounded p-2 overflow-x-auto text-[10px] text-muted-foreground border border-border/30">
              {JSON.stringify(toolCall.parameters, null, 2)}
            </pre>
          </div>

          {toolCall.status === "completed" && toolCall.result && (
            <div>
              <span className="text-green-400 block mb-1">Result:</span>
              <pre className="bg-background/50 rounded p-2 overflow-x-auto text-[10px] text-muted-foreground border border-green-500/20 max-h-32 overflow-y-auto">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(toolCall.result), null, 2);
                  } catch {
                    return toolCall.result;
                  }
                })()}
              </pre>
            </div>
          )}

          {toolCall.status === "failed" && toolCall.error && (
            <div>
              <span className="text-red-400 block mb-1">Error:</span>
              <pre className="bg-red-500/5 rounded p-2 text-[10px] text-red-300 border border-red-500/20">
                {toolCall.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isTool = message.role === "tool";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-[10px] text-muted-foreground/50 bg-background/40 rounded-full px-3 py-1 border border-border/20">
          {message.content}
        </div>
      </div>
    );
  }

  if (isTool) {
    return null; // Tool messages are displayed as cards in assistant messages
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary/20 border border-primary/30 text-primary-foreground"
            : "glass-dark border border-border/40 text-foreground"
        }`}
      >
        <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Tool calls attached to this message */}
        {message.tool_calls &&
          message.tool_calls.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.tool_calls.map((tc) => (
                <ToolCallCard key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}

        <div
          className={`text-[9px] mt-1.5 ${
            isUser ? "text-primary-foreground/40" : "text-muted-foreground/30"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// AGENT CHAT COMPONENT
// ============================================================================

interface AgentChatProps {
  initialMessages?: AgentMessage[];
  onSendMessage?: (message: string) => void;
  mode?: "merchant" | "customer";
}

export default function AgentChat({
  initialMessages,
  onSendMessage,
  mode = "merchant",
}: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    if (initialMessages && initialMessages.length > 0) return initialMessages;
    // Pre-load phantom messages in demo mode
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "true") {
      return phantomAgentMessages;
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [streamingContent, setStreamingContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const demoMode = useGuildStore((s) => s.demoMode);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || status === "thinking") return;

      const userMessage: AgentMessage = {
        id: `amsg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setStatus("thinking");
      setStreamingContent("");
      onSendMessage?.(text);

      // Abort any previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: messages,
            mode,
            stream: true,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Read SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        setStatus("streaming");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const event: SSEEvent = JSON.parse(trimmed.slice(6));

              switch (event.type) {
                case "thinking":
                  setStreamingContent(`🧠 ${event.content || ""}`);
                  break;

                case "tool_call":
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === "assistant" && last.streaming) {
                      return prev.map((m, i) =>
                        i === prev.length - 1
                          ? {
                              ...m,
                              tool_calls: [
                                ...(m.tool_calls || []),
                                { ...event.toolCall!, status: "running" as const },
                              ],
                            }
                          : m
                      );
                    }
                    // If no streaming assistant message, add a placeholder
                    return [
                      ...prev,
                      {
                        id: `amsg-${Date.now()}-stream`,
                        role: "assistant" as const,
                        content: "",
                        tool_calls: [{ ...event.toolCall!, status: "running" as const }],
                        timestamp: new Date().toISOString(),
                        streaming: true,
                      },
                    ];
                  });
                  break;

                case "tool_result":
                  setMessages((prev) =>
                    prev.map((m) => {
                      if (!m.tool_calls) return m;
                      return {
                        ...m,
                        tool_calls: m.tool_calls.map((tc) =>
                          tc.id === event.toolCall!.id
                            ? { ...tc, ...event.toolCall! }
                            : tc
                        ),
                      };
                    })
                  );
                  break;

                case "message":
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (
                      last &&
                      last.role === "assistant" &&
                      last.streaming &&
                      last.id === event.message!.id
                    ) {
                      return prev.map((m, i) =>
                        i === prev.length - 1
                          ? { ...event.message!, streaming: false }
                          : m
                      );
                    }
                    return [...prev, { ...event.message!, streaming: false }];
                  });
                  setStreamingContent("");
                  break;

                case "error":
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `amsg-${Date.now()}-error`,
                      role: "assistant",
                      content: `❌ **Error:** ${event.error || "Something went wrong. Please try again."}`,
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                  setStreamingContent("");
                  break;

                case "done":
                  setStatus("idle");
                  setStreamingContent("");
                  break;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        console.error("[AgentChat] Fetch error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: `amsg-${Date.now()}-fail`,
            role: "assistant",
            content: `❌ Connection error. Please check your network and try again.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setStatus("idle");
        setStreamingContent("");
      }
    },
    [messages, status, mode, onSendMessage]
  );

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  // Handle key press (Enter to send, Shift+Enter for newline)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  // Clear session
  const clearSession = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
    setStatus("idle");
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold text-primary mb-2">Agentic AI</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Your autonomous shopkeeper assistant. I can search inventory, manage bounties,
              check pricing, track orders, and more.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {SUGGESTED_ACTIONS.map((action) => (
                <motion.button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="px-3 py-1.5 text-xs rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Streaming indicator */}
        {(status === "thinking" || status === "streaming") && streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start mb-3"
          >
            <div className="max-w-[85%] rounded-2xl px-4 py-3 glass-dark border border-border/40">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="animate-pulse">🧠</span>
                {streamingContent}
              </div>
            </div>
          </motion.div>
        )}

        {/* Animated dots when thinking but no content yet */}
        {status === "thinking" && !streamingContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-3"
          >
            <div className="rounded-2xl px-4 py-3 glass-dark border border-border/40">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border/40 p-3 glass-dark">
        {/* Suggested action chips */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SUGGESTED_ACTIONS.map((action) => (
              <motion.button
                key={action.label}
                onClick={() => sendMessage(action.prompt)}
                className="px-2.5 py-1 text-[10px] rounded-full border border-primary/20 bg-primary/5 text-primary/80 hover:bg-primary/10 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={status === "thinking"}
              >
                {action.label}
              </motion.button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about the store..."
              className="w-full bg-background/60 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all min-h-[40px] max-h-[120px]"
              rows={1}
              disabled={status === "thinking"}
            />
          </div>

          <motion.button
            type="submit"
            disabled={!input.trim() || status === "thinking"}
            className="h-[40px] w-[40px] rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {status === "thinking" ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
