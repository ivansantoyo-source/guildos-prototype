"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 50);
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
        if (e.key === "Enter" && document.activeElement === confirmRef.current) onConfirm();
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-[0_0_40px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3 mb-4">
          {variant === "destructive" ? (
            <span className="text-2xl">⚠️</span>
          ) : (
            <span className="text-2xl">ℹ️</span>
          )}
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs rounded-lg font-bold transition-colors ${
              variant === "destructive"
                ? "bg-destructive text-white hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
