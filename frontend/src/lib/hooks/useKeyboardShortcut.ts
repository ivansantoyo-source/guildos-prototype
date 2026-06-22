"use client";

import { useEffect } from "react";

interface ShortcutOptions {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  enabled?: boolean;
  ignoreInputs?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {}
) {
  const { ctrl = false, meta = false, shift = false, alt = false, enabled = true, ignoreInputs = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (ignoreInputs) {
        const tag = (e.target as HTMLElement).tagName;
        const isEditable = (e.target as HTMLElement).isContentEditable;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || isEditable) return;
      }

      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const metaMatch = meta ? e.metaKey : true;
      const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
      const altMatch = alt ? e.altKey : !e.altKey;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, ctrl, meta, shift, alt, enabled, ignoreInputs, callback]);
}
