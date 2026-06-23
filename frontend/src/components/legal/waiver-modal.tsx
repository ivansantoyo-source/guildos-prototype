"use client";

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Check, ChevronDown, Download } from 'lucide-react';
import SignaturePad, { type SignaturePadHandle } from '@/components/legal/signature-pad';

interface WaiverModalProps {
  title: string;
  content: string;
  version: number;
  requiresSignature?: boolean;
  requiresGuardianIfMinor?: boolean;
  minorAgeThreshold?: number;
  isOpen: boolean;
  onAccept: (signatureData?: string, guardianEmail?: string) => void;
  onClose: () => void;
}

export default function WaiverModal({
  title,
  content,
  version,
  requiresSignature = false,
  requiresGuardianIfMinor = false,
  minorAgeThreshold = 18,
  isOpen,
  onAccept,
  onClose,
}: WaiverModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [guardianEmail, setGuardianEmail] = useState('');
  const [needsGuardian, setNeedsGuardian] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const signaturePadRef = useRef<SignaturePadHandle>(null);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const onSignatureSave = useCallback((dataUrl: string) => {
    setSignatureData(dataUrl);
  }, []);

  const onSignatureClear = useCallback(() => {
    setSignatureData(null);
  }, []);

  const handleAccept = () => {
    if (requiresSignature && !showSignature) {
      setShowSignature(true);
      return;
    }
    if (requiresGuardianIfMinor && needsGuardian && !guardianEmail) {
      return;
    }
    onAccept(signatureData ?? undefined, guardianEmail || undefined);
  };

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
            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border-primary)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--gold-primary)]" />
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">Version {version} — Must be accepted to continue</p>
                </div>
              </div>
              {/* Cannot close without accepting */}
            </div>

            {/* Content */}
            <div
              ref={contentRef}
              onScroll={handleScroll}
              className="flex-1 p-6 overflow-y-auto text-sm leading-relaxed text-[var(--text-secondary)] space-y-4"
              style={{ maxHeight: '50vh' }}
            >
              <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">
                {content}
              </div>

              {!hasScrolledToBottom && (
                <div className="sticky bottom-0 p-3 text-center text-xs text-[var(--text-tertiary)] bg-[var(--bg-secondary)]/80 rounded-lg">
                  <ChevronDown className="w-4 h-4 inline mr-1 animate-bounce" />
                  Please read all terms above to continue
                </div>
              )}
            </div>

            {/* Acceptance */}
            <div className="p-5 border-t border-[var(--border-primary)] space-y-4">
              {/* Guardian toggle */}
              {requiresGuardianIfMinor && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsGuardian}
                    onChange={(e) => setNeedsGuardian(e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--neon-primary)]"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">
                    I am under {minorAgeThreshold} years old and need a guardian to sign
                  </span>
                </label>
              )}

              {needsGuardian && (
                <input
                  type="email"
                  placeholder="Guardian's email address"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                />
              )}

              {/* Signature pad — production-ready canvas capture */}
              {showSignature && (
                <div className="p-4 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]">
                  <p className="text-xs text-[var(--text-secondary)] mb-2">Sign below:</p>
                  <SignaturePad
                    ref={signaturePadRef}
                    onSave={onSignatureSave}
                    onClear={onSignatureClear}
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">By signing, you agree to the terms above.</p>
                </div>
              )}

              {/* Scroll-to-accept checkbox */}
              <label className={`flex items-center gap-3 ${hasScrolledToBottom ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  disabled={!hasScrolledToBottom}
                  className="w-4 h-4 rounded accent-[var(--neon-primary)]"
                />
                <span className="text-sm text-[var(--text-primary)]">
                  I have read and agree to the {title}
                </span>
              </label>

              {/* Action buttons */}
              <div className="flex gap-3">
                {requiresSignature && !showSignature ? (
                  <button
                    onClick={handleAccept}
                    disabled={!accepted || (needsGuardian && !guardianEmail)}
                    className="flex-1 py-3 rounded-xl bg-[var(--neon-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Sign
                  </button>
                ) : (
                  <button
                    onClick={handleAccept}
                    disabled={!accepted || (needsGuardian && !guardianEmail)}
                    className="flex-1 py-3 rounded-xl bg-[var(--neon-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Accept & Continue
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-primary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
