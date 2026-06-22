"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info" | "legendary";
  title: string;
  description?: string;
  createdAt: number;
}

// Global toast state (module-level for cross-component access)
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let globalToasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((fn) => fn([...globalToasts]));
}

export function toast(type: Toast["type"], title: string, description?: string) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  globalToasts = [...globalToasts, { id, type, title, description, createdAt: Date.now() }];
  notifyListeners();
  // Auto-dismiss
  setTimeout(() => dismissToast(id), 4000);
}

export function dismissToast(id: string) {
  globalToasts = globalToasts.filter((t) => t.id !== id);
  notifyListeners();
}

const typeStyles: Record<string, { icon: string; border: string; bg: string; glow: string }> = {
  success: { icon: "✅", border: "border-l-green-500", bg: "bg-green-500/5", glow: "shadow-[0_0_15px_rgba(34,197,94,0.1)]" },
  error: { icon: "❌", border: "border-l-red-500", bg: "bg-red-500/5", glow: "shadow-[0_0_15px_rgba(239,68,68,0.1)]" },
  warning: { icon: "⚠️", border: "border-l-yellow-500", bg: "bg-yellow-500/5", glow: "shadow-[0_0_15px_rgba(234,179,8,0.1)]" },
  info: { icon: "ℹ️", border: "border-l-blue-500", bg: "bg-blue-500/5", glow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]" },
  legendary: { icon: "💎", border: "border-l-purple-500", bg: "bg-purple-500/5", glow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]" },
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast[]) => setToasts(t);
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter((l) => l !== listener); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const style = typeStyles[t.type] ?? typeStyles.info;
        const age = Date.now() - t.createdAt;
        const progress = Math.max(0, 100 - (age / 4000) * 100);

        return (
          <div
            key={t.id}
            className={`pointer-events-auto bg-card backdrop-blur-md border ${style.border} ${style.bg} ${style.glow} rounded-lg p-3 animate-slide-in-right transition-all`}
            style={{ animation: "toastSlideIn 0.3s ease-out" }}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm mt-0.5">{style.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{t.title}</p>
                {t.description && <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-0.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  t.type === "legendary" ? "bg-purple-500" :
                  t.type === "error" ? "bg-red-500" :
                  t.type === "warning" ? "bg-yellow-500" :
                  t.type === "success" ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
