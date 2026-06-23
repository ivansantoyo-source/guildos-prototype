"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Check, Send, Loader2 } from 'lucide-react';
import SignaturePad, { type SignaturePadHandle } from '@/components/legal/signature-pad';
import { isDemoMode } from '@/lib/toggles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParentalGateProps {
  /** Whether the modal is visible. */
  isOpen: boolean;
  /** Called when the gate is dismissed without providing consent. */
  onClose: () => void;
  /**
   * Called when consent is granted.
   * @param guardianEmail – verified parent/guardian email
   * @param signature     – base64 signature data URL
   */
  onConsent: (guardianEmail: string, signature: string) => void;
  /** The minor's age, for display purposes. */
  minorAge: number;
  /** Which feature triggered the gate (e.g. "payments", "VR booking"). */
  requestedFeature: string;
}

// ---------------------------------------------------------------------------
// Feature descriptions
// ---------------------------------------------------------------------------

const FEATURE_LABELS: Record<string, string> = {
  payments: 'Payments & Wallet',
  vr_booking: 'VR Session Booking',
  extended_sessions: 'Extended Gaming Sessions',
  trade_in: 'Trade-In / Pawn Services',
  tournament: 'Tournament Participation',
};

function describeFeature(feature: string): string {
  return FEATURE_LABELS[feature] ?? feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ParentalGate({
  isOpen,
  onClose,
  onConsent,
  minorAge,
  requestedFeature,
}: ParentalGateProps) {
  const [guardianEmail, setGuardianEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isGuardian, setIsGuardian] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const signatureRef = useRef<SignaturePadHandle>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Demo mode auto-fill
  const demo = isDemoMode();

  // Focus the email input on mount
  useEffect(() => {
    if (isOpen) {
      setSent(false);
      setSending(false);
      setError('');
      setEmailError('');
      setGuardianEmail('');
      setIsGuardian(false);
      signatureRef.current?.clear();

      if (demo) {
        setGuardianEmail('parent@example.com');
        setIsGuardian(true);
      }
    }
    // Only run on open state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const validateEmail = useCallback((email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    if (!re.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  const handleSendConsent = useCallback(async () => {
    setError('');

    // Validate
    if (!validateEmail(guardianEmail)) {
      emailInputRef.current?.focus();
      return;
    }

    if (!isGuardian) {
      setError('You must confirm you are the parent or legal guardian.');
      return;
    }

    const signaturePad = signatureRef.current;
    const signature = signaturePad?.getSignature();

    if (!signature) {
      setError('Please provide your signature to confirm consent.');
      return;
    }

    setSending(true);

    if (demo) {
      // Simulate API call in demo mode
      await new Promise((r) => setTimeout(r, 1000));
      setSent(true);
      setSending(false);
      onConsent(guardianEmail.trim(), signature);
      return;
    }

    try {
      const res = await fetch('/api/legal/parental-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardianEmail: guardianEmail.trim(),
          signature,
          minorAge,
          feature: requestedFeature,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to send consent request. Please try again.');
      }

      setSent(true);
      onConsent(guardianEmail.trim(), signature);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSending(false);
    }
  }, [guardianEmail, isGuardian, minorAge, requestedFeature, demo, validateEmail, onConsent]);

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setGuardianEmail(val);
      if (emailError) validateEmail(val);
    },
    [emailError, validateEmail],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !sending && !sent) {
        handleSendConsent();
      }
    },
    [handleSendConsent, sending, sent],
  );

  // ---- Render ---------------------------------------------------------
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border-primary)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="parental-gate-title"
          >
            {/* ---- Header ---- */}
            <div className="flex items-start gap-4 p-5 border-b border-[var(--border-primary)]">
              <div className="shrink-0 p-2 rounded-full bg-[var(--gold-primary)]/10">
                <Shield className="w-5 h-5 text-[var(--gold-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="parental-gate-title" className="text-lg font-bold text-[var(--text-primary)]">
                  Parental Consent Required
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  The following feature requires verified guardian consent for minors:
                </p>
              </div>
            </div>

            {/* ---- Body ---- */}
            <div className="p-5 space-y-5">
              {/* Feature card */}
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {describeFeature(requestedFeature)}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    User age: {minorAge} years old
                  </p>
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="guardian-email"
                  className="block text-sm font-medium text-[var(--text-primary)]"
                >
                  Parent / Guardian Email
                </label>
                <input
                  ref={emailInputRef}
                  id="guardian-email"
                  type="email"
                  placeholder="parent@example.com"
                  value={guardianEmail}
                  onChange={handleEmailChange}
                  onBlur={() => guardianEmail && validateEmail(guardianEmail)}
                  onKeyDown={handleKeyDown}
                  disabled={sending || sent}
                  className={`w-full px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--neon-primary)]/50 ${
                    emailError
                      ? 'border-red-500/60'
                      : 'border-[var(--border-primary)]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  autoComplete="email"
                />
                {emailError && (
                  <p id="email-error" className="text-xs text-red-400" role="alert">
                    {emailError}
                  </p>
                )}
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  A consent request will be sent to this email address.
                </p>
              </div>

              {/* Guardian checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGuardian}
                  onChange={(e) => setIsGuardian(e.target.checked)}
                  disabled={sending || sent}
                  className="mt-0.5 w-4 h-4 rounded accent-[var(--neon-primary)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  I am the parent or legal guardian of this user, and I authorize access to{' '}
                  <strong className="text-[var(--text-primary)]">{describeFeature(requestedFeature)}</strong>.
                </span>
              </label>

              {/* Signature pad */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Digital Signature
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Sign below to confirm your consent.
                </p>
                <SignaturePad
                  ref={signatureRef}
                  disabled={sending || sent}
                />
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-red-400 flex items-center gap-1.5"
                    role="alert"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Demo mode badge */}
              {demo && (
                <div className="p-2 rounded-lg bg-[var(--neon-primary)]/10 border border-[var(--neon-primary)]/20">
                  <p className="text-xs text-[var(--neon-primary)] text-center">
                    Demo mode — auto-filled and will simulate success
                  </p>
                </div>
              )}
            </div>

            {/* ---- Actions ---- */}
            <div className="flex gap-3 p-5 border-t border-[var(--border-primary)]">
              <button
                onClick={handleSendConsent}
                disabled={sending || sent}
                className="flex-1 py-3 rounded-xl bg-[var(--neon-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : sent ? (
                  <>
                    <Check className="w-4 h-4" />
                    Consent Sent
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Consent Request
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={sending}
                className="px-5 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
