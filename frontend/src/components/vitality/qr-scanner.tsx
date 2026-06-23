"use client";

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, X, CheckCircle, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (qrHash: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

/**
 * QR Scanner component using the html5-qrcode library.
 * Falls back to manual code entry if camera unavailable.
 */
export default function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [demoSimulating, setDemoSimulating] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);

  const startScan = useCallback(async () => {
    setError(null);
    setScanning(true);

    // Check for demo mode — simulate scan after 2 seconds
    if (window.location.search.includes('demo=true') || localStorage.getItem('guildos_demo_mode') === 'true') {
      setDemoSimulating(true);
      setTimeout(() => {
        setDemoSimulating(false);
        setScanning(false);
        onScan('stretch-neck-001'); // default to first quest for demo
      }, 2000);
      return;
    }

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          scanner.stop().catch(() => {});
          setScanning(false);
          onScan(decodedText);
        },
        () => {
          // scan failure — ignore
        },
      );
    } catch (err) {
      console.error('QR scanner error:', err);
      setError('Camera access denied or unavailable. Enter the quest code manually below.');
      setScanning(false);
    }
  }, [onScan]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md p-6 rounded-2xl bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border-primary)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Scan className="w-5 h-5 text-[var(--neon-primary)]" />
              Scan Vitality QR
            </h3>

            {/* Scanner viewport */}
            <div
              ref={scannerRef}
              id="qr-reader"
              className="relative w-full aspect-square rounded-xl bg-[var(--bg-tertiary)] overflow-hidden mb-4"
            >
              {!scanning && !demoSimulating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera className="w-12 h-12 text-[var(--text-tertiary)]" />
                  <p className="text-sm text-[var(--text-secondary)] text-center px-4">
                    Scan a QR code at a Vitality Station to complete a quest and earn XP
                  </p>
                </div>
              )}

              {demoSimulating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-16 h-16 rounded-full bg-[var(--neon-primary)]/20 border-2 border-[var(--neon-primary)] flex items-center justify-center"
                  >
                    <Scan className="w-8 h-8 text-[var(--neon-primary)]" />
                  </motion.div>
                  <p className="text-sm text-[var(--neon-primary)] font-medium">Scanning...</p>
                </div>
              )}

              {scanning && (
                <div className="absolute inset-0">
                  {/* Scanning animation border */}
                  <motion.div
                    className="absolute inset-4 border-2 border-[var(--neon-primary)] rounded-lg"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <motion.div
                    className="absolute left-4 right-4 h-0.5 bg-[var(--neon-primary)]"
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
              )}
            </div>

            {/* Start / Manual fallback */}
            {!scanning && !demoSimulating ? (
              <div className="space-y-3">
                <button
                  onClick={startScan}
                  className="w-full py-3 rounded-xl bg-[var(--neon-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Open Camera
                </button>

                <div className="text-center text-xs text-[var(--text-tertiary)]">— or enter code —</div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter quest code..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--neon-primary)]"
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  />
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualCode.trim()}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm font-medium text-[var(--text-primary)] border border-[var(--border-primary)] hover:border-[var(--neon-primary)] transition-colors disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : null}

            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter quest code manually..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  />
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualCode.trim()}
                    className="px-4 py-2 rounded-lg bg-[var(--neon-primary)] text-black text-sm font-bold"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
