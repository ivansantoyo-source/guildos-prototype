"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import type { ShopkeeperMessage } from "@/lib/types";

const SYSTEM_GREETING: ShopkeeperMessage = {
  id: "sys-greeting",
  role: "assistant",
  content:
    "Greetings, traveler! Welcome to the Guild. I am the Synthetic Shopkeeper — your encyclopedic guide to everything retro-gaming. Ask me about our current stock, game history, hardware variants, or trade-in values. How may I assist you today?",
  timestamp: new Date().toISOString(),
};

// ============================================================
// FORMAT MARKDOWN (simple markdown rendering)
// ============================================================
function MarkdownContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="text-[11px] bg-muted px-1 py-0.5 rounded text-gold font-mono">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ============================================================
// TYPING INDICATOR (shown before streaming starts)
// ============================================================
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
          🤖 SHOPKEEPER
        </span>
        <div className="flex gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STREAMING MESSAGE (progressive text rendering)
// ============================================================
function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-card border border-border text-foreground">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            🤖 SHOPKEEPER
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-neon-pulse" />
        </div>
        {content ? (
          <MarkdownContent content={content} />
        ) : (
          <div className="flex gap-1.5 py-1">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUGGESTED FOLLOW-UPS
// ============================================================
const FOLLOW_UPS: Record<string, string[]> = {
  default: [
    "What's the rarest item in stock?",
    "How do faction wars work?",
    "Tell me about the Konami Code",
  ],
  price: [
    "What's trending up this week?",
    "Should I adjust any prices?",
    "Show me items under $50",
  ],
  inventory: [
    "What needs restocking?",
    "Any price spikes I should know about?",
    "Recommend a good JRPG from stock",
  ],
};

// ============================================================
// CLEAR CHAT CONFIRMATION DIALOG
// ============================================================
function ClearChatDialog({ onCancel, onClear }: { onCancel: () => void; onClear: () => void }) {
  const focusTrapRef = useFocusTrap({ onEscape: onCancel });

  return (
    <div ref={focusTrapRef} className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Clear conversation confirmation">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
        <h3 className="text-sm font-bold text-foreground mb-2">Clear Conversation?</h3>
        <p className="text-xs text-muted-foreground mb-4">This will delete all messages in the current session. This action cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button onClick={onClear} className="flex-1 py-2.5 text-xs rounded bg-destructive/20 text-destructive font-bold hover:bg-destructive/30 transition-colors">
            🗑️ CLEAR
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SHOPKEEPER PAGE
// ============================================================
export default function ShopkeeperPage() {
  const messages = useGuildStore((s) => s.shopkeeperMessages);
  const addMessage = useGuildStore((s) => s.addShopkeeperMessage);
  const updateMessage = useGuildStore((s) => s.updateShopkeeperMessage);
  const clearMessages = useGuildStore((s) => s.clearShopkeeperMessages);
  const inventory = useGuildStore((s) => s.inventory);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>(FOLLOW_UPS.default);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize with greeting
  useEffect(() => {
    if (!hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      addMessage(SYSTEM_GREETING);
    }
  }, [messages.length, addMessage]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent]);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    // Cancel any existing stream
    abortControllerRef.current?.abort();

    const userMessage: ShopkeeperMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: query.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    setInput("");
    setIsLoading(true);
    setIsStreaming(false);
    setStreamingContent("");

    // AbortController for stream cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Prepare conversation history (last 6 turns, excluding the greeting)
    const historyMessages = messages
      .filter((m) => m.id !== "sys-greeting")
      .slice(-6);

    try {
      const res = await fetch("/api/ai/shopkeeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          query: userMessage.content,
          inventory: inventory.slice(0, 20).map((i) => ({
            item_name: i.item_name,
            platform: i.platform,
            market_value: i.market_value,
            stock_count: i.stock_count,
            condition: i.condition,
            tags: i.tags,
          })),
          messages: historyMessages,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        // --- STREAMING response ---
        const messageId = `ai-${Date.now()}`;
        const timestamp = new Date().toISOString();

        setIsStreaming(true);
        setStreamingMessageId(messageId);

        // Create an empty message in the store that will be filled
        addMessage({
          id: messageId,
          role: "assistant",
          content: "",
          timestamp,
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullReply = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullReply += chunk;
          setStreamingContent(fullReply);

          // Update the message in the store progressively
          updateMessage(messageId, { content: fullReply });
        }

        setIsStreaming(false);
        setStreamingContent("");
        setStreamingMessageId(null);
      } else {
        // --- JSON response (mock fallback) ---
        const data = await res.json();
        const reply = data.reply || "Hmm, the signal is fuzzy. Try again, traveler.";

        addMessage({
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: reply,
          timestamp: new Date().toISOString(),
        });
      }

      // Update follow-ups based on query context
      if (query.toLowerCase().includes("price") || query.toLowerCase().includes("cost") || query.toLowerCase().includes("value")) {
        setFollowUps(FOLLOW_UPS.price);
      } else if (query.toLowerCase().includes("stock") || query.toLowerCase().includes("inventory") || query.toLowerCase().includes("item")) {
        setFollowUps(FOLLOW_UPS.inventory);
      } else {
        setFollowUps(FOLLOW_UPS.default);
      }
    } catch (err: unknown) {
      // Don't show error for aborted requests
      if (err instanceof DOMException && err.name === "AbortError") return;

      setIsStreaming(false);
      setStreamingContent("");
      setStreamingMessageId(null);

      addMessage({
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Connection to the Oracle has been interrupted. Please try again.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, addMessage, updateMessage, inventory]);

  const handleSend = () => {
    sendMessage(input);
  };

  const handleClearChat = () => {
    // Abort any in-progress stream
    abortControllerRef.current?.abort();
    clearMessages();
    setShowClearConfirm(false);
    setIsStreaming(false);
    setStreamingContent("");
    setStreamingMessageId(null);
    hasInitialized.current = false;
    // Greeting will be re-added by effect
    setTimeout(() => {
      hasInitialized.current = true;
      addMessage(SYSTEM_GREETING);
    }, 100);
  };

  // Voice recognition
  const handleVoiceInput = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      addMessage({
        id: `sys-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Voice input is not supported in your browser. Try Chrome or Edge.",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const SpeechRecognitionAPI = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      addMessage({
        id: `sys-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Voice input is not available.",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const recognition = new (SpeechRecognitionAPI as new () => SpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = () => {
      addMessage({
        id: `sys-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Could not recognize speech. Please try again.",
        timestamp: new Date().toISOString(),
      });
    };

    recognition.start();
  }, [addMessage]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">🤖 SYNTHETIC SHOPKEEPER</h1>
          <p className="text-xs text-muted-foreground mt-1">
            DeepSeek-V3 · Encyclopedic retro-gaming clerk · Inventory-aware
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Share conversation */}
          <button
            onClick={() => {
              const text = messages.map((m) => `[${m.role.toUpperCase()}] ${m.content}`).join("\n\n");
              navigator.clipboard.writeText(text);
            }}
            className="px-2 py-1.5 text-[11px] rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
            disabled={messages.length === 0}
          >
            🔗 Share
          </button>
          {/* Clear chat */}
          {messages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-2 py-1.5 text-[11px] rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
            >
              🗑️ Clear
            </button>
          )}
          <span className="w-2 h-2 rounded-full bg-primary animate-neon-pulse" />
          <span className="text-[11px] text-primary">ONLINE</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <span className="text-5xl block mb-4">🤖</span>
            <p className="text-sm">No messages yet. Start a conversation with the Shopkeeper!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
              msg.role === "user" ? "bg-primary/15 border border-primary/20 text-foreground" : "bg-card border border-border text-foreground"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {msg.role === "user" ? "YOU" : "🤖 SHOPKEEPER"}
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {msg.role === "assistant" || msg.role === "system" ? (
                <MarkdownContent content={msg.content} />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Loading states */}
        {isLoading && !isStreaming && <TypingIndicator />}
        {isStreaming && <StreamingMessage content={streamingContent} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-ups */}
      {!isLoading && messages.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2 shrink-0">
          {followUps.map((query) => (
            <button
              key={query}
              onClick={() => {
                setInput(query);
                setTimeout(() => {
                  sendMessage(query);
                }, 100);
              }}
              className="px-3 py-1.5 text-xs rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
            >
              {query}
            </button>
          ))}
        </div>
      )}

      {/* Suggested Queries (when chat is empty or short) */}
      {messages.length <= 1 && !isLoading && (
        <div className="flex flex-wrap gap-2 px-4 pb-2 shrink-0">
          {[
            { label: "💰 Check Prices", query: "What are the current market prices looking like?" },
            { label: "🎮 Recommend a JRPG", query: "Can you recommend a good JRPG from our inventory?" },
            { label: "💎 Rarest Item?", query: "What's the rarest item we have in stock?" },
            { label: "⚔️ Faction Wars", query: "Tell me about the faction wars!" },
            { label: "⬆️⬆️⬇️⬇️", query: "Konami Code?" },
          ].map((pill) => (
            <button
              key={pill.label}
              onClick={() => {
                setInput(pill.query);
                setTimeout(() => {
                  sendMessage(pill.query);
                }, 100);
              }}
              className="px-3 py-1.5 text-xs rounded-full bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}

      {/* Context info */}
      <div className="px-4 pb-1 shrink-0">
        <p className="text-[10px] text-muted-foreground">
          📦 Referencing {inventory.length} inventory items · Context-aware AI
        </p>
      </div>

      {/* Input Area */}
      <div className="border-t border-border pt-4 shrink-0">
        <div className="flex gap-3">
          <button
            onClick={handleVoiceInput}
            disabled={isLoading}
            className="px-3 py-3 text-sm rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50"
            title="Voice input"
            id="btn-voice-input"
          >
            🎤
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask the Shopkeeper anything..."
            className="flex-1 px-4 py-3 text-sm bg-card border border-border rounded-lg guild-input text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
            id="input-shopkeeper-query"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            id="btn-shopkeeper-send"
          >
            SEND
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Responses are AI-generated. Stock queries reference your live inventory data.
        </p>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <ClearChatDialog
          onCancel={() => setShowClearConfirm(false)}
          onClear={handleClearChat}
        />
      )}
    </div>
  );
}
