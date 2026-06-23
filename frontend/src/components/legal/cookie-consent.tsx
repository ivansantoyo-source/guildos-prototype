"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ChevronRight, Settings } from 'lucide-react';

type ConsentLevel = 'all' | 'essential' | 'custom';

interface CookiePreferences {
  essential: boolean; // always true
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const STORAGE_KEY = 'guildos_cookie_consent';

function getStoredPreferences(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storePreferences(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: true,
  });

  useEffect(() => {
    // Show banner if no consent stored
    const stored = getStoredPreferences();
    if (!stored) {
      setShow(true);
    }
  }, []);

  const acceptAll = () => {
    const all: CookiePreferences = { essential: true, analytics: true, marketing: true, functional: true };
    storePreferences(all);
    setShow(false);
  };

  const acceptEssential = () => {
    const essential: CookiePreferences = { essential: true, analytics: false, marketing: false, functional: false };
    storePreferences(essential);
    setShow(false);
  };

  const saveCustom = () => {
    storePreferences(preferences);
    setShow(false);
    setShowCustomize(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border-primary)] shadow-2xl">
            {!showCustomize ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Cookie className="w-5 h-5 text-[var(--gold-primary)] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">Cookie Preferences</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      We use cookies to enhance your gaming experience, analyze site traffic, and provide guild features.
                      By accepting, you help us keep the tavern running. See our{' '}
                      <a href="/legal/cookies" className="text-[var(--neon-primary)] underline">Cookie Policy</a>.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={acceptAll}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--neon-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={acceptEssential}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-medium border border-[var(--border-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    Essential Only
                  </button>
                  <button
                    onClick={() => setShowCustomize(true)}
                    className="px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm border border-[var(--border-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Customize Preferences</h4>

                {[
                  { key: 'essential' as const, label: 'Essential', desc: 'Required for the site to function. Cannot be disabled.', disabled: true },
                  { key: 'functional' as const, label: 'Functional', desc: 'Enhanced features like saved preferences and local game data.', disabled: false },
                  { key: 'analytics' as const, label: 'Analytics', desc: 'Help us understand how the tavern is used so we can improve.', disabled: false },
                  { key: 'marketing' as const, label: 'Marketing', desc: 'Personalized offers for games, events, and guild perks.', disabled: false },
                ].map(({ key, label, desc, disabled }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[key]}
                      disabled={disabled}
                      onChange={(e) => setPreferences((p) => ({ ...p, [key]: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded accent-[var(--neon-primary)]"
                    />
                    <div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                      {disabled && <span className="text-xs text-[var(--text-tertiary)] ml-1">(Required)</span>}
                      <p className="text-xs text-[var(--text-secondary)]">{desc}</p>
                    </div>
                  </label>
                ))}

                <div className="flex gap-2">
                  <button onClick={saveCustom} className="flex-1 py-2.5 rounded-xl bg-[var(--neon-primary)] text-black font-bold text-sm">
                    Save Preferences
                  </button>
                  <button onClick={() => setShowCustomize(false)} className="px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-sm">
                    Back
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3 flex justify-center gap-4 text-xs">
              <a href="/legal/terms" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Terms</a>
              <a href="/legal/privacy" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Privacy</a>
              <a href="/legal/cookies" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">Cookies</a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
