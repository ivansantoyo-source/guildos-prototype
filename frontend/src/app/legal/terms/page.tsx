import React from 'react';
import { Shield, Scale, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Terms of Service — GuildOS' };

export default function TermsPage() {
  return (
    <div id="main-content" className="min-h-screen bg-[var(--bg-primary)] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Scale className="w-8 h-8 text-[var(--gold-primary)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Terms of Service</h1>
            <p className="text-sm text-[var(--text-tertiary)]">Last updated: June 23, 2026 • Version 1.0</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-secondary)]">
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">1. Acceptance of Terms</h2>
            <p>By accessing or using GuildOS (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. These terms constitute a legally binding agreement between you and the GuildOS operator (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">2. Eligibility</h2>
            <p>You must be at least 13 years of age to use the Platform. Users under 18 must have a parent or legal guardian review and accept these terms on their behalf. By using the Platform, you represent and warrant that you meet these eligibility requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">3. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">4. Digital Wallet & Payments</h2>
            <p>All financial transactions are processed through Stripe. Store credit is non-transferable and non-refundable except as required by law. Split-pay escrow funds are held by Stripe until a lobby is fully funded or the payment deadline expires, at which point auto-refunds are initiated.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">5. User Conduct</h2>
            <p>Users agree not to: (a) exploit bugs or glitches in the Platform; (b) manipulate XP, wallets, or booking systems; (c) harass, threaten, or defraud other users; (d) use the Platform for illegal activities including the sale of stolen goods; (e) attempt to bypass security measures.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">6. Liability Waiver</h2>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-[var(--gold-primary)]" />
                <span className="text-sm font-bold text-[var(--text-primary)]">Physical Activity Disclaimer</span>
              </div>
              <p className="text-sm">Use of physical gaming spaces, VR equipment, and participation in events involves inherent risks. By using the Platform, you assume all risks associated with physical activities and agree to hold GuildOS and its operators harmless for any injuries, losses, or damages arising from your use of the Platform or physical premises.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">7. Pawn Shop & Trade-In Compliance</h2>
            <p>All trade-ins and cash-for-goods transactions are subject to local pawn shop and secondhand dealer laws. You affirm that you are the lawful owner of all items traded or sold through the Platform. Providing false ownership information may result in criminal prosecution. We reserve the right to hold items for the statutory holding period and report transactions to law enforcement as required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">8. Intellectual Property</h2>
            <p>GuildOS, its branding, codebase, and the GuildOS operating system are proprietary intellectual property. Users retain ownership of their content and data. You grant us a limited license to use your content as necessary to provide the Platform services.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">9. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, GUILDOS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">10. Governing Law</h2>
            <p>These terms are governed by the laws of the State of Delaware. Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">11. Contact</h2>
            <p>For questions about these terms, contact: legal@guildos.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
