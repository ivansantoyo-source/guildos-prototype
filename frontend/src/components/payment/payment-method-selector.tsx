"use client";

// ============================================================================
// GUILDOS — Payment Method Selector
// Glass card radio group: Store Credit, Credit/Debit Card (Stripe), Split Pay
// ============================================================================

import React, { useEffect, useState } from 'react';
import { CreditCard, Wallet, Users, AlertCircle, Plus } from 'lucide-react';
import type { Wallet as WalletType } from '@/lib/types';

export type PaymentMethod = 'store_credit' | 'card' | 'split_pay';

interface PaymentMethodSelectorProps {
  /** Wallet balance to display. Undefined means wallet not loaded. */
  walletBalance?: number;
  /** The total amount to be charged — used for balance validation. */
  total: number;
  /** Currently selected payment method. */
  value: PaymentMethod;
  /** Called when the user selects a different method. */
  onChange: (method: PaymentMethod) => void;
  /** Called when user clicks "Add Payment Method" for a new Stripe card. */
  onAddPaymentMethod?: () => void;
  /** Optional CSS class override. */
  className?: string;
}

const METHODS: Array<{
  id: PaymentMethod;
  label: string;
  subtitle: string;
  icon: React.ElementType;
}> = [
  {
    id: 'store_credit',
    label: 'Store Credit',
    subtitle: 'Pay with wallet balance',
    icon: Wallet,
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    subtitle: 'Pay with Stripe',
    icon: CreditCard,
  },
  {
    id: 'split_pay',
    label: 'Split Pay (LFG)',
    subtitle: 'Split with your party',
    icon: Users,
  },
];

export default function PaymentMethodSelector({
  walletBalance,
  total,
  value,
  onChange,
  onAddPaymentMethod,
  className = '',
}: PaymentMethodSelectorProps) {
  const insufficientCredit =
    value === 'store_credit' &&
    walletBalance !== undefined &&
    walletBalance < total;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
        Payment Method
      </label>

      <div className="space-y-2">
        {METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = value === method.id;
          const isStoreCredit = method.id === 'store_credit';

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-[var(--neon-primary)]/10 border-[var(--neon-primary)]/40'
                  : 'bg-[var(--glass-bg)] border-[var(--border-primary)] hover:border-[var(--neon-primary)]/20'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isSelected
                    ? 'text-[var(--neon-primary)]'
                    : 'text-[var(--text-tertiary)]'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold ${
                      isSelected
                        ? 'text-[var(--neon-primary)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {method.label}
                  </span>
                  {isStoreCredit && walletBalance !== undefined && (
                    <span
                      className={`text-xs font-mono font-bold ${
                        insufficientCredit
                          ? 'text-red-400'
                          : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      ${walletBalance.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {isStoreCredit && walletBalance !== undefined
                    ? `${method.subtitle} — $${walletBalance.toFixed(2)}`
                    : method.subtitle}
                </p>
              </div>

              {/* Radio indicator */}
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'border-[var(--neon-primary)]'
                    : 'border-[var(--text-tertiary)]'
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-[var(--neon-primary)]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Insufficient balance warning */}
      {insufficientCredit && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">
            Insufficient balance. You need{' '}
            <span className="font-bold">
              ${(total - (walletBalance ?? 0)).toFixed(2)} more.
            </span>
            {' '}Switch to card or split pay.
          </p>
        </div>
      )}

      {/* Add Payment Method button (card section) */}
      {value === 'card' && onAddPaymentMethod && (
        <button
          type="button"
          onClick={onAddPaymentMethod}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--border-primary)] text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--text-tertiary)] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Payment Method
        </button>
      )}
    </div>
  );
}
