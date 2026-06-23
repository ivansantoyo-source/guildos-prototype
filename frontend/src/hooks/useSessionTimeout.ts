"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { toast } from "@/components/ui/toaster";

// ─────────────────────────────────────────────────────────
// Return type
// ─────────────────────────────────────────────────────────
export interface SessionTimeoutState {
  expiresAt: Date | null;
  minutesRemaining: number | null;
  isWarning: boolean;
  isExpiring: boolean;
  refreshSession: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────
const CHECK_INTERVAL_MS = 15_000;        // check every 15 seconds
const WARNING_THRESHOLD_MS = 5 * 60_000; // 5 minutes
const EXPIRING_THRESHOLD_MS = 60_000;    // 1 minute
const REFRESH_COOLDOWN_MS = 30_000;      // don't spam refresh
const WARNING_TOAST_ID = "session-5min-warning";
const EXPIRING_TOAST_ID = "session-1min-warning";

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────
export function useSessionTimeout(): SessionTimeoutState {
  const demoMode = useGuildStore((s) => s.demoMode);

  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const [isWarning, setIsWarning] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);

  // Refs for listener lifecycle
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const inWarningWindowRef = useRef(false);
  const hasExpiredRef = useRef(false);
  const mountedRef = useRef(false);

  // ── Build Supabase client once (client-side only, skip SSR) ──
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  useEffect(() => {
    try {
      supabaseRef.current = createClient();
    } catch {
      // Supabase env vars may not be set in dev/test — run without session tracking
    }
  }, []);

  function getSupabase() {
    return supabaseRef.current;
  }

  // ── Compute derived warning state ──
  const computeState = useCallback((expiresAtDate: Date | null) => {
    if (!expiresAtDate) {
      setExpiresAt(null);
      setMinutesRemaining(null);
      setIsWarning(false);
      setIsExpiring(false);
      inWarningWindowRef.current = false;
      return;
    }

    const now = Date.now();
    const expiryMs = expiresAtDate.getTime();
    const remainingMs = expiryMs - now;
    const remainingMin = Math.max(0, Math.floor(remainingMs / 60_000));

    setExpiresAt(expiresAtDate);
    setMinutesRemaining(remainingMin);

    const warning = remainingMs <= WARNING_THRESHOLD_MS && remainingMs > 0;
    const expiring = remainingMs <= EXPIRING_THRESHOLD_MS && remainingMs > 0;

    setIsWarning(warning);
    setIsExpiring(expiring);
    inWarningWindowRef.current = warning;
  }, []);

  // ── Refresh session ──
  const refreshSession = useCallback(async () => {
    if (hasExpiredRef.current) return;
    if (demoMode) return;

    // Debounce: don't refresh more than once per cooldown period
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_COOLDOWN_MS) return;
    lastRefreshRef.current = now;

    try {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("[useSessionTimeout] Refresh failed:", error.message);
        return;
      }
      if (data?.session?.expires_at) {
        const newExpiry = new Date(data.session.expires_at * 1000);
        computeState(newExpiry);
        console.log("[useSessionTimeout] Session refreshed, new expiry:", newExpiry.toISOString());
      }
    } catch (err) {
      console.error("[useSessionTimeout] Refresh error:", err);
    }
  }, [demoMode, computeState]);

  // ── Interactive refresh on user interaction ──
  useEffect(() => {
    if (demoMode) return;

    const handleInteraction = () => {
      if (inWarningWindowRef.current && !hasExpiredRef.current) {
        refreshSession();
      }
    };

    document.addEventListener("click", handleInteraction, { passive: true });
    document.addEventListener("keydown", handleInteraction, { passive: true });

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [demoMode, refreshSession]);

  // ── Core session monitor ──
  useEffect(() => {
    mountedRef.current = true;

    // Demo mode: session never expires
    if (demoMode) {
      computeState(null);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    // ── Get initial session ──
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("[useSessionTimeout] getSession error:", error.message);
          return;
        }
        if (data?.session?.expires_at && mountedRef.current) {
          computeState(new Date(data.session.expires_at * 1000));
        }
      } catch (err) {
        console.warn("[useSessionTimeout] getSession threw:", err);
      }
    };

    initSession();

    // ── Listen for auth state changes (token refresh from Supabase) ──
    const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      if (session?.expires_at) {
        computeState(new Date(session.expires_at * 1000));
      } else {
        computeState(null);
      }
    });

    unsubscribeRef.current = authData?.subscription?.unsubscribe ?? null;

    // ── Periodic check ──
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      checkExpiry(supabase);
    }, CHECK_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  // ── Watch isWarning/isExpiring for toasts and redirects ──
  useEffect(() => {
    if (demoMode) return;
    if (!expiresAt) return;

    const remainingMs = expiresAt.getTime() - Date.now();

    // 5-minute warning toast (only show once)
    if (remainingMs > 0 && remainingMs <= WARNING_THRESHOLD_MS && remainingMs > EXPIRING_THRESHOLD_MS) {
      toast("warning", "Session expiring soon", "Your session expires in 5 minutes. Click or press a key to extend.");
      window.dispatchEvent(new CustomEvent("guildos:session-expiring", { detail: { minutesRemaining: Math.ceil(remainingMs / 60_000) } }));
    }

    // 1-minute urgent warning toast
    if (remainingMs > 0 && remainingMs <= EXPIRING_THRESHOLD_MS) {
      toast("warning", "Session expiring!", "Your session will expire in under 1 minute. Click or press a key to extend now.");
    }

    // Expired — only redirect once
    if (remainingMs <= 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      toast("error", "Session expired", "Your session has expired. Redirecting to login...");
      window.dispatchEvent(new CustomEvent("guildos:session-expired"));
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWarning, isExpiring]);

  // ── Cleanup session check ──
  async function checkExpiry(supabase: ReturnType<typeof createClient>) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return;
      if (data?.session?.expires_at) {
        computeState(new Date(data.session.expires_at * 1000));
      }
    } catch {
      // silently ignore
    }
  }

  // ── Demo mode: never expires ──
  if (demoMode) {
    return {
      expiresAt: null,
      minutesRemaining: null,
      isWarning: false,
      isExpiring: false,
      refreshSession: async () => {},
    };
  }

  return {
    expiresAt,
    minutesRemaining,
    isWarning,
    isExpiring,
    refreshSession,
  };
}
