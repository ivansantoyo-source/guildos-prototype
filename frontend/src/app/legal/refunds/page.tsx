import React from 'react';
import { ScrollText } from 'lucide-react';

export const metadata = { title: 'Refund Policy — GuildOS' };

export default function RefundPage() {
  return (
    <div id="main-content" className="min-h-screen bg-[var(--bg-primary)] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ScrollText className="w-8 h-8 text-[var(--gold-primary)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Refund Policy</h1>
            <p className="text-sm text-[var(--text-tertiary)]">Last updated: June 23, 2026 • Version 1.0</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-secondary)]">
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">1. Station & Room Bookings</h2>
            <p>Cancellations made more than 24 hours before the booking start time receive a full refund. Cancellations within 24 hours receive 50% refund. No-shows are not refunded. Bookings can be managed from your profile dashboard.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">2. LFG Split-Pay & Escrow</h2>
            <p>If a paid LFG lobby does not reach full funding by the payment deadline, all partial payments are automatically refunded in full. Once a lobby is fully funded, refunds are at the discretion of the lobby host. Disputes can be escalated to platform support.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">3. Potions & Food Orders</h2>
            <p>Orders can be cancelled for a full refund before preparation begins. Once marked &ldquo;Preparing,&rdquo; orders cannot be refunded. If an order is incorrect or unsatisfactory, please speak with staff for a replacement or refund.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">4. Store Credit & Wallets</h2>
            <p>Store credit is non-refundable for cash except where required by law. Unused store credit remains in your wallet indefinitely and can be applied to any GuildOS purchase or booking.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">5. Subscriptions (Save Rooms)</h2>
            <p>Monthly Save Room subscriptions can be cancelled at any time. Cancellation takes effect at the end of the current billing period. No partial-month refunds are issued. Subscriptions are managed through Stripe Billing.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
