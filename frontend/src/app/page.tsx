"use client";

import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";

// ============================================================
// TERMINAL TYPING EFFECT
// ============================================================
function TerminalTyping() {
  const fullText = "GUILD_OS v1.0.0 INITIALIZED";
  const [displayed, setDisplayed] = useState("");
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    if (displayed.length < fullText.length) {
      const t = setTimeout(() => setDisplayed(fullText.slice(0, displayed.length + 1)), 50);
      return () => clearTimeout(t);
    }
    const flash = setInterval(() => setCursor((c) => !c), 500);
    return () => clearInterval(flash);
  }, [displayed]);

  return (
    <div className="font-mono text-lg sm:text-xl md:text-2xl text-primary text-glow-green">
      <span className="text-muted-foreground">$ </span>
      <span>{displayed}</span>
      <span className={`${cursor ? "opacity-100" : "opacity-0"} transition-opacity`}>_</span>
    </div>
  );
}

// ============================================================
// LIVE DEMO SCROLLING PREVIEW
// ============================================================
function DemoPreview() {
  const stats = useMemo(() => [
    { label: "Gold Farmed", value: "$12,450", icon: "🪙" },
    { label: "Legendary Drops", value: "3", icon: "💎" },
    { label: "Active Bounties", value: "3", icon: "📜" },
    { label: "Open Lobbies", value: "2", icon: "🏟️" },
  ], []);

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Terminal window frame */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_0_60px_oklch(0.78_0.2_145/10%)]">
        <div className="bg-card/80 border-b border-border px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <div className="w-3 h-3 rounded-full bg-gold" />
            <div className="w-3 h-3 rounded-full bg-primary" />
          </div>
          <span className="text-[11px] text-muted-foreground font-mono ml-2">MERCHANT TERMINAL</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-neon-pulse" />
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-background/50 rounded-lg p-3 text-center">
                <span className="text-lg">{s.icon}</span>
                <p className="text-sm font-bold text-primary mt-1">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="h-8 bg-muted/30 rounded animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground">📦 Inventory loading...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FACTION WAR TEASER WITH LIVE COUNTERS
// ============================================================
function FactionWarTeaser() {
  const [counters, setCounters] = useState([
    { name: "Nintendo Nomads", icon: "🔴", points: 4250, active: false },
    { name: "Sega Syndicate", icon: "🔵", points: 3820, active: false },
    { name: "Sony Sentinels", icon: "🟣", points: 5100, active: true },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounters((prev) => prev.map((c) => ({
        ...c,
        points: c.points + Math.floor(Math.random() * 10),
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const maxPoints = Math.max(...counters.map((c) => c.points), 1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
      {counters.map((faction) => (
        <div
          key={faction.name}
          className={`guild-card rounded-xl p-5 text-center ${
            faction.active ? "border-gold/40 bg-gold/[3%]" : "border-border"
          }`}
        >
          <span className="text-3xl block">{faction.icon}</span>
          <h3 className="text-sm font-bold text-foreground mt-2">{faction.name}</h3>
          <p className="text-xl font-bold font-mono text-gold text-glow-gold mt-2">
            {faction.points.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {faction.active ? "👑 Currently Leading" : `${Math.round((faction.points / maxPoints) * 100)}% of leader`}
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                faction.active ? "bg-gold" : "bg-muted-foreground/30"
              }`}
              style={{ width: `${(faction.points / maxPoints) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// FAQ ACCORDION
// ============================================================
function FaqAccordion() {
  const faqs = [
    { q: "What is GuildOS?", a: "GuildOS is a multi-tenant SaaS platform that transforms brick-and-mortar retro-gaming storefronts into AI-powered, gamified ecosystems. It includes AI inventory scanning, community bounty boards, arcade leaderboards, faction wars, and an AI shopkeeper." },
    { q: "Do I need any hardware to use GuildOS?", a: "No special hardware is required. GuildOS works on any modern web browser. The vision scanner works with any smartphone camera or uploaded image." },
    { q: "Can I use GuildOS if I only sell online?", a: "Absolutely! GuildOS is designed for both physical storefronts and online-only operations. The Nexus, Bounty Board, and Shopkeeper AI work equally well in both contexts." },
    { q: "How does the AI Shopkeeper work?", a: "The Synthetic Shopkeeper uses DeepSeek-V3 to answer questions about your inventory, suggest prices, recommend games to customers, and provide encyclopedic retro-gaming knowledge — all while referencing your live inventory data." },
    { q: "What are faction wars?", a: "Every customer picks a faction at signup. Every dollar they spend contributes to their faction's monthly score. The winning faction gets 10% off store credit for the next month. It's gamification that drives loyalty and repeat visits." },
    { q: "Can I migrate from my current POS system?", a: "GuildOS includes import tools for most major POS systems and inventory management platforms. Contact our team for migration assistance." },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      {faqs.map((faq, i) => (
        <div key={i} className="guild-card bg-card rounded-lg overflow-hidden border-border">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full px-5 py-4 flex items-center justify-between text-left"
          >
            <span className="text-sm font-medium text-foreground">{faq.q}</span>
            <span className={`text-xs text-muted-foreground transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
          {openIndex === i && (
            <div className="px-5 pb-4 animate-in slide-in-from-top-1 duration-200">
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PRICING SECTION WITH YEARLY/MONTHLY TOGGLE
// ============================================================
function PricingSection() {
  const [yearly, setYearly] = useState(false);

  const TIERS = [
    { name: "Merchant", monthly: 99, yearly: 79, features: ["RPG Admin Dashboard", "Local SEO", "Base Inventory Engine", "Up to 500 items", "Email support"] },
    { name: "Wizard", monthly: 249, yearly: 199, features: ["Synthetic Shopkeeper AI", "Vision Loot Scanner", "SMS Marketing", "Up to 5,000 items", "Priority support"], popular: true },
    { name: "Time Lord", monthly: 499, yearly: 399, features: ["Inter-Guild Trade Network", "B2B Engine", "Unlimited Nexus", "Unlimited items", "24/7 dedicated support"] },
  ];

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-xs ${!yearly ? "text-foreground font-bold" : "text-muted-foreground"}`}>Monthly</span>
        <button
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle yearly billing"
          onClick={() => setYearly(!yearly)}
          className={`w-12 h-6 rounded-full transition-colors ${yearly ? "bg-primary" : "bg-muted"} relative`}
        >
          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${yearly ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
        <span className={`text-xs ${yearly ? "text-foreground font-bold" : "text-muted-foreground"}`}>
          Yearly
          {yearly && <span className="text-xp ml-1 font-bold">Save ~20%</span>}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {TIERS.map((tier) => {
          const price = yearly ? tier.yearly : tier.monthly;
          return (
            <div
              key={tier.name}
              className={`guild-card rounded-xl p-6 bg-card ${
                tier.popular
                  ? "border-primary/40 shadow-[0_0_30px_oklch(0.78_0.2_145/10%)] relative"
                  : "border-border"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
              <p className="text-3xl font-bold text-primary mt-2">
                ${price}
                <span className="text-sm text-muted-foreground font-normal">/mo</span>
              </p>
              {yearly && (
                <p className="text-[10px] text-xp mt-0.5">${tier.monthly}/mo if monthly</p>
              )}
              <ul className="mt-4 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-primary text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-6 w-full py-2.5 rounded text-sm font-bold inline-flex items-center justify-center bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
              >
                Deploy Guild
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TRUSTED BY LOGOS
// ============================================================
function TrustedBy() {
  const logos = [
    "RETRO_REALM", "PIXEL_PARADISE", "NEO_TOKYO_GAMES", "CLASSIC_BITS",
    "ARCADE_ALLEY", "TIME_WARP_GAMING", "8BIT_BAZAAR", "CARTRIDGE_KINGS",
  ];

  return (
    <div className="overflow-hidden">
      <p className="text-xs text-muted-foreground text-center mb-6 uppercase tracking-wider">
        Trusted by retro-gaming legends
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 opacity-50">
        {logos.map((name) => (
          <div key={name} className="font-mono text-xs text-foreground/30 tracking-widest border border-border/30 px-3 py-1.5 rounded">
            [{name}]
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN LANDING PAGE
// ============================================================
export default function LandingPage() {
  return (
    <div id="main-content" className="min-h-screen bg-background text-foreground">
      {/* === HERO === */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <nav className="relative z-10 max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <span className="text-xl font-bold text-primary text-glow-green tracking-wider">GUILD_OS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/demo?demo=true" className="text-sm text-muted-foreground hover:text-gold transition-colors">🛒 Store</Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sign In</Link>
            <Link href="/dashboard?demo=true" className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">Launch Demo</Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
          {/* Animated Terminal */}
          <div className="mb-8">
            <TerminalTyping />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-neon-pulse" />
            Now in Alpha · Accepting Guilds
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            <span className="text-foreground">Turn Your Game Store Into</span>
            <br />
            <span className="text-primary text-glow-green">An RPG Empire</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            GuildOS transforms brick-and-mortar retro-gaming storefronts into
            AI-powered, gamified ecosystems. Automated inventory with vision AI,
            community supply chains, faction wars, and an AI shopkeeper that never sleeps.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard?demo=true" onClick={() => { if (typeof window !== 'undefined') { try { const { useGuildStore } = require('@/lib/store/useGuildStore'); useGuildStore.getState().setDemoMode(true); } catch {} }}} className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_oklch(0.78_0.2_145/20%)]">
              ⚔️ Enter the Guild
            </Link>
            <Link href="/demo?demo=true" className="px-8 py-3.5 rounded-lg bg-gold/20 border border-gold/40 text-gold font-bold text-base hover:bg-gold/30 transition-all hover:shadow-[0_0_20px_rgba(255,193,7,0.3)]">
              🛒 Visit the Store
            </Link>
            <Link href="#features" className="px-8 py-3.5 rounded-lg border border-border text-foreground font-medium text-base hover:border-primary/40 hover:bg-primary/5 transition-all">
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* === LIVE DEMO PREVIEW === */}
      <section className="max-w-6xl mx-auto px-6 pb-24 -mt-8">
        <DemoPreview />
      </section>

      {/* === FEATURES === */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground">
            Four Modules. One <span className="text-primary">Operating System</span>.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Every feature replaces boring e-commerce with RPG mechanics your customers actually want to engage with.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: "📸", title: "The Loot Scanner", description: "Snap a photo. AI identifies, prices, and catalogues your inventory in seconds. Real-time PriceCharting integration.", color: "text-primary" },
            { icon: "📜", title: "The Bounty Board", description: "Community-sourced supply chain. Post wanted items, set scarcity multipliers, and let your players bring the loot to you.", color: "text-gold" },
            { icon: "🏟️", title: "The Nexus", description: "LFG matchmaking, arcade leaderboards with retaliation alerts, and monetized Save Room rentals with QR access.", color: "text-legendary" },
            { icon: "🤖", title: "Synthetic Shopkeeper", description: "DeepSeek-V3 powered AI clerk with encyclopedic retro-gaming knowledge. Queries your live inventory. Never sleeps.", color: "text-xp" },
          ].map((feature) => (
            <div key={feature.title} className="guild-card bg-card rounded-xl p-6 border-border">
              <span className="text-3xl">{feature.icon}</span>
              <h3 className={`text-lg font-bold mt-3 ${feature.color}`}>{feature.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === FACTION WARS TEASER === */}
      <section className="border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              The <span className="text-gold text-glow-gold">Faction Wars</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Every customer picks a faction at signup. Every dollar they spend fuels the war. The winning faction gets 10% off for a month.
            </p>
          </div>
          <FactionWarTeaser />
        </div>
      </section>

      {/* === TRUSTED BY === */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-b border-border">
        <TrustedBy />
      </section>

      {/* === FAQ === */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
        </div>
        <FaqAccordion />
      </section>

      {/* === PRICING === */}
      <section className="bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              Choose Your <span className="text-primary">Tier</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>
          <PricingSection />
        </div>
      </section>

      {/* === CTA === */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-foreground">
          Ready to <span className="text-primary text-glow-green">Level Up</span> Your Store?
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Join the guild. Transform your retro-gaming storefront into an RPG-powered community hub.
        </p>
        <Link
          href="/dashboard?demo=true"
          className="mt-8 inline-flex px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_oklch(0.78_0.2_145/20%)]"
        >
          ⚔️ Deploy Your Guild
        </Link>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🎮</span>
            <span className="text-sm font-bold text-primary">GUILD_OS</span>
            <span className="text-xs text-muted-foreground ml-2">v1.0.0-alpha</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GuildOS. Built for retro-gaming legends.
          </p>
        </div>
      </footer>
    </div>
  );
}
