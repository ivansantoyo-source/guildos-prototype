import React from 'react';
import { Cookie } from 'lucide-react';

export const metadata = { title: 'Cookie Policy — GuildOS' };

export default function CookiePage() {
  return (
    <div id="main-content" className="min-h-screen bg-[var(--bg-primary)] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Cookie className="w-8 h-8 text-[var(--gold-primary)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Cookie Policy</h1>
            <p className="text-sm text-[var(--text-tertiary)]">Last updated: June 23, 2026 • Version 1.0</p>
          </div>
        </div>
        <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-secondary)]">
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device that help us remember your preferences, keep you signed in, and understand how you use GuildOS. They do not contain malware or viruses.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">2. Essential Cookies</h2>
            <p>These are required for the Platform to function. They include: authentication sessions (Supabase JWT), demo mode toggles, CSRF protection tokens, and cookie consent preferences. Essential cookies cannot be disabled.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">3. Functional Cookies</h2>
            <p>These enable enhanced features: saved UI preferences (sidebar collapsed state, sound toggle, color theme), recently viewed items, and station booking history. Disabling these may reduce functionality but the core platform will still work.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">4. Analytics Cookies</h2>
            <p>We use analytics to understand how gamers use the tavern: which pages are visited, how long sessions last, which features are most popular. This helps us improve the platform. Analytics data is anonymized and aggregated.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">5. Marketing Cookies</h2>
            <p>Used to personalize promotions for events, new game arrivals, and faction-based offers. We do not use third-party advertising networks or sell cookie data to advertisers.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">6. Third-Party Cookies</h2>
            <p>Stripe places cookies for payment processing and fraud prevention. Supabase places cookies for authentication and real-time subscriptions. Discord may place cookies if you connect your account.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">7. Managing Cookies</h2>
            <p>You can manage your preferences at any time by clearing your browser data and revisiting the site to set new preferences, or through your browser settings. Note that disabling essential cookies will prevent you from using the Platform.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
