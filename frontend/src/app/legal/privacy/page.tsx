import React from 'react';
import { Shield, Eye, Lock } from 'lucide-react';

export const metadata = { title: 'Privacy Policy — GuildOS' };

export default function PrivacyPage() {
  return (
    <div id="main-content" className="min-h-screen bg-[var(--bg-primary)] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Eye className="w-8 h-8 text-[var(--neon-primary)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Privacy Policy</h1>
            <p className="text-sm text-[var(--text-tertiary)]">Last updated: June 23, 2026 • Version 1.0</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-secondary)]">
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">1. Information We Collect</h2>
            <p>We collect information you provide directly: name, email, phone number, date of birth, faction affiliation, gaming preferences, and purchase history. We also collect: IP addresses, device information, browser type, pages visited, and interaction data. For identity verification, we may collect government ID information through Stripe Identity.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">2. How We Use Your Information</h2>
            <p>We use your information to: provide and improve the Platform, process payments, manage bookings, enable LFG matchmaking, track XP and achievements, facilitate bounty fulfillment, verify identity for compliance purposes, send notifications, and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">3. Data Sharing</h2>
            <p>We share data with: Stripe (payment processing and identity verification), Supabase (database hosting), Vercel (hosting), Discord (if you connect your account), and law enforcement (as required by pawn shop regulations). We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">4. Data Retention</h2>
            <p>Account data is retained for the life of your account plus 90 days after deletion. Financial transaction records are retained for 7 years as required by tax law. Pawn shop transaction records and chain of custody data are retained per local regulations.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">5. Your Rights</h2>
            <p>You have the right to: access your data, correct inaccurate data, delete your account, export your data in portable format, and withdraw consent where processing is consent-based. To exercise these rights, contact privacy@guildos.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">6. Children&apos;s Privacy</h2>
            <p>Users under 13 are not permitted on the Platform. For users aged 13-17, we require parental consent and offer parental controls including time limits, spend limits, and activity monitoring. We do not knowingly collect data from children under 13.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">7. Security</h2>
            <p>We implement industry-standard security measures including encryption at rest and in transit, row-level security on all database tables, server-side validation, rate limiting, and regular security audits. However, no system is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">8. Contact</h2>
            <p>Data Protection Officer: privacy@guildos.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
