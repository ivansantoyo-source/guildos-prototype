"use client";

import { useEffect, useRef } from "react";

/**
 * Traps focus within a container element for modal accessibility.
 *
 * - On mount, saves `document.activeElement` for restoration on unmount.
 * - On Tab/Shift+Tab, wraps focus between first and last focusable children.
 * - Calls `onEscape` when Escape is pressed (optional).
 * - Returns a `containerRef` to attach to the modal's container element.
 * - On unmount, restores the previously focused element.
 *
 * Usage:
 *   const focusTrapRef = useFocusTrap({ onEscape: handleClose });
 *   return <div ref={focusTrapRef}>...</div>;
 */
export function useFocusTrap({ onEscape }: { onEscape?: () => void } = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Save the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the first focusable element inside the modal
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusableElements = () => {
      if (!container) return [];
      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
    };

    // Small delay to let the modal render
    const focusTimer = setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // If no focusable elements, focus the container itself
        container.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap from first to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: wrap from last to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previously focused element
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [onEscape]);

  return containerRef;
}
