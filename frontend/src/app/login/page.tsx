"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FlowState = "idle" | "sending" | "sent" | "code_input" | "verifying" | "error";

export default function LoginPage() {
  const router = useRouter();

  // Flow state
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  // OTP input
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer (resend disabled for 60s)
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Countdown effect — fires when cooldown changes from 0 to >0
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = undefined;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // We intentionally only trigger when cooldown goes from 0 to >0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowState]);

  // ================================================================
  // Send magic link / OTP email
  // ================================================================
  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setFlowState("sending");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || "Please wait before requesting a new code.");
          setCooldown(60);
        } else {
          setError(data.error || "Failed to send verification code. Please try again.");
        }
        setFlowState("idle");
        return;
      }

      // Demo mode: pre-fill OTP for testing
      if (data.demoOtp) {
        const digits = data.demoOtp.split("");
        setOtpDigits(digits);
        setIsDemo(true);
      }

      setFlowState("sent");
      setCooldown(60);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setFlowState("idle");
    }
  };

  // ================================================================
  // Switch to code input mode (resends OTP)
  // ================================================================
  const handleTryCode = async () => {
    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before requesting a new code.`);
      return;
    }

    setError(null);

    // Silently resend the OTP (don't show loading since they already got the email)
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Non-blocking — the first send already triggered the email
    }

    setFlowState("code_input");
    setCooldown(60);
    // Focus first OTP box
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  // ================================================================
  // OTP input handlers
  // ================================================================
  const handleOtpChange = (index: number, value: string) => {
    // Handle paste: if pasted value is multiple characters
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").split("").slice(0, 6);
      const newDigits = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);

      // Focus the next empty slot or the last slot
      const nextEmpty = newDigits.findIndex((d) => d === "");
      const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
      otpRefs.current[focusIdx]?.focus();
      return;
    }

    // Only allow single digit
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace on empty field → go back
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    // Left arrow
    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    // Right arrow
    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const digits = pastedText.replace(/\D/g, "").split("").slice(0, 6);

    if (digits.length === 0) return;

    const newDigits = [...otpDigits];
    digits.forEach((d, i) => {
      if (i < 6) newDigits[i] = d;
    });
    setOtpDigits(newDigits);

    const nextEmpty = newDigits.findIndex((d) => d === "");
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    otpRefs.current[focusIdx]?.focus();
  };

  // ================================================================
  // Verify OTP code
  // ================================================================
  const handleVerifyOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError(null);
    setFlowState("verifying");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError("Too many verification attempts. Please wait a moment.");
        } else if (res.status === 401) {
          setError(data.error || "Invalid or expired code. Please request a new one.");
          // Reset OTP digits for retry
          setOtpDigits(Array(6).fill(""));
          setFlowState("code_input");
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } else {
          setError(data.error || "Verification failed. Please try again.");
        }
        return;
      }

      // Success! Redirect based on whether user is new
      if (data.isNewUser && !data.isDemo) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setFlowState("code_input");
    }
  };

  // ================================================================
  // OAuth sign-in
  // ================================================================
  const handleOAuth = useCallback(
    async (provider: "google" | "github" | "discord") => {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    },
    []
  );

  // ================================================================
  // Demo mode
  // ================================================================
  const handleDemoMode = () => {
    router.push("/dashboard?demo=true");
  };

  // ================================================================
  // Retry from error
  // ================================================================
  const handleRetry = () => {
    setError(null);
    setFlowState("idle");
  };

  // ================================================================
  // Render helpers
  // ================================================================

  const renderOtpInput = () => (
    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
      {otpDigits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { otpRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleOtpChange(index, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className="w-10 h-12 text-center text-lg font-bold bg-background border border-border rounded-lg guild-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );

  const renderOAuthButtons = () => (
    <div className="mt-4 space-y-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px]">
          <span className="bg-card px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleOAuth("google")}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
        >
          <span aria-hidden="true" className="text-sm">🔵</span>
          <span className="sr-only">Sign in with Google</span>
          <span className="hidden sm:inline">Google</span>
        </button>
        <button
          onClick={() => handleOAuth("github")}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
        >
          <span aria-hidden="true" className="text-sm">👤</span>
          <span className="sr-only">Sign in with GitHub</span>
          <span className="hidden sm:inline">GitHub</span>
        </button>
        <button
          onClick={() => handleOAuth("discord")}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
        >
          <span aria-hidden="true" className="text-sm">🎮</span>
          <span className="sr-only">Sign in with Discord</span>
          <span className="hidden sm:inline">Discord</span>
        </button>
      </div>
    </div>
  );

  // ================================================================
  // Main render
  // ================================================================

  return (
    <div id="main-content" className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-legendary/5 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-legendary/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🎮</span>
            <span className="text-2xl font-bold text-primary text-glow-green tracking-wider">GUILD_OS</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">
            Sign in to your terminal
          </p>
        </div>

        {/* Form Card */}
        <div
          className="guild-card bg-card rounded-xl p-6 border-primary/20 shadow-[0_0_30px_oklch(0.78_0.2_145/5%)]"
          aria-busy={flowState === "sending" || flowState === "verifying"}
        >
          {/* ===== FLOW STATE: IDLE ===== */}
          {flowState === "idle" && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMagicLink();
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="input-login-email"
                    className="text-[11px] text-muted-foreground uppercase tracking-wider"
                  >
                    Email
                  </label>
                  <input
                    id="input-login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@guildos.com"
                    className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <div role="alert" aria-live="assertive" className="p-2 rounded bg-destructive/10 border border-destructive/30">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_oklch(0.78_0.2_145/15%)] disabled:opacity-50"
                  id="btn-send-magic-link"
                >
                  <span className="inline-flex items-center gap-2">
                    🔗 Send Magic Link
                  </span>
                </button>
              </form>

              {renderOAuthButtons()}

              {/* Demo Mode Quick Access */}
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={handleDemoMode}
                  className="w-full py-2.5 rounded-lg bg-gold/10 border border-gold/20 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
                  id="btn-demo-mode"
                >
                  ⚡ Launch Demo Mode (No Account Required)
                </button>
              </div>

              {/* Terms */}
              <div className="mt-3 text-center">
                <p className="text-[10px] text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </div>
            </>
          )}

          {/* ===== FLOW STATE: SENDING ===== */}
          {flowState === "sending" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-sm text-foreground font-medium">Sending magic link...</p>
              <p className="text-xs text-muted-foreground mt-1">Please wait a moment.</p>
            </div>
          )}

          {/* ===== FLOW STATE: SENT ===== */}
          {flowState === "sent" && (
            <div className="text-center py-2">
              <span className="text-5xl block mb-4">📧</span>
              <h2 className="text-sm font-bold text-primary mb-2">Check Your Email</h2>
              <p className="text-xs text-muted-foreground mb-2">
                We sent a magic link to{" "}
                <span className="text-primary font-medium">{email}</span>.
                Click the link in the email to sign in instantly.
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Didn&apos;t receive it? Check your spam folder or try a different method.
              </p>

              {/* Resend cooldown */}
              {cooldown > 0 ? (
                <p className="text-xs text-muted-foreground mb-4">
                  Resend available in{" "}
                  <span className="text-primary font-mono">{cooldown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleSendMagicLink}
                  className="text-xs text-primary hover:underline mb-4"
                >
                  Resend magic link
                </button>
              )}

              <div className="border-t border-border pt-4 mt-2">
                <button
                  onClick={handleTryCode}
                  className="text-xs text-primary hover:underline"
                  disabled={cooldown > 0}
                >
                  {cooldown > 0
                    ? `Enter code instead (wait ${cooldown}s)`
                    : "Enter code instead"}
                </button>
              </div>

              {error && (
                <div role="alert" aria-live="assertive" className="p-2 rounded bg-destructive/10 border border-destructive/30 mt-3">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* ===== FLOW STATE: CODE_INPUT ===== */}
          {flowState === "code_input" && (
            <>
              <div className="text-center">
                <h2 className="text-sm font-bold text-primary mb-1">Enter Verification Code</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Enter the 6-digit code sent to{" "}
                  <span className="text-primary font-medium">{email}</span>
                </p>
              </div>

              {renderOtpInput()}

              <div className="mt-4 space-y-3">
                {error && (
                  <div role="alert" aria-live="assertive" className="p-2 rounded bg-destructive/10 border border-destructive/30">
                    <p className="text-xs text-destructive text-center">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={otpDigits.join("").length !== 6}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_oklch(0.78_0.2_145/15%)] disabled:opacity-50"
                  id="btn-verify-otp"
                >
                  Verify Code
                </button>

                <div className="flex items-center justify-between">
                  {cooldown > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Resend code in {cooldown}s
                    </span>
                  ) : (
                    <button
                      onClick={handleTryCode}
                      className="text-xs text-primary hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                  <button
                    onClick={() => setFlowState("sent")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ===== FLOW STATE: VERIFYING ===== */}
          {flowState === "verifying" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="text-sm text-foreground font-medium">Verifying code...</p>
              <p className="text-xs text-muted-foreground mt-1">Signing you in.</p>
            </div>
          )}

          {/* ===== FLOW STATE: ERROR ===== */}
          {flowState === "error" && (
            <div className="text-center py-4">
              <span className="text-5xl block mb-4">⚠️</span>
              <h2 className="text-sm font-bold text-destructive mb-2">Authentication Error</h2>
              <p className="text-xs text-muted-foreground mb-4">
                {error || "Something went wrong. Please try again."}
              </p>
              <button
                onClick={handleRetry}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
