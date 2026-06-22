import Link from "next/link";

const FEATURES = [
  {
    icon: "📸",
    title: "The Loot Scanner",
    description:
      "Snap a photo. AI identifies, prices, and catalogues your inventory in seconds. Real-time PriceCharting integration.",
    color: "text-primary",
  },
  {
    icon: "📜",
    title: "The Bounty Board",
    description:
      "Community-sourced supply chain. Post wanted items, set scarcity multipliers, and let your players bring the loot to you.",
    color: "text-gold",
  },
  {
    icon: "🏟️",
    title: "The Nexus",
    description:
      "LFG matchmaking, arcade leaderboards with retaliation alerts, and monetized Save Room rentals with QR access.",
    color: "text-legendary",
  },
  {
    icon: "🤖",
    title: "Synthetic Shopkeeper",
    description:
      "DeepSeek-V3 powered AI clerk with encyclopedic retro-gaming knowledge. Queries your live inventory. Never sleeps.",
    color: "text-xp",
  },
];

const TIERS = [
  {
    name: "Merchant",
    price: "$99",
    features: ["RPG Admin Dashboard", "Local SEO", "Base Inventory Engine"],
  },
  {
    name: "Wizard",
    price: "$249",
    features: ["Synthetic Shopkeeper AI", "Vision Loot Scanner", "SMS Marketing"],
    popular: true,
  },
  {
    name: "Time Lord",
    price: "$499",
    features: ["Inter-Guild Trade Network", "B2B Engine", "Unlimited Nexus"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* === HERO === */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <nav className="relative z-10 max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <span className="text-xl font-bold text-primary text-glow-green tracking-wider">
              GUILD_OS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
            >
              Launch Demo
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-28">
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
            community supply chains, faction wars, and an AI shopkeeper that never
            sleeps.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_oklch(0.78_0.2_145/20%)]"
            >
              ⚔️ Enter the Guild
            </Link>
            <Link
              href="#features"
              className="px-8 py-3.5 rounded-lg border border-border text-foreground font-medium text-base hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              See Features
            </Link>
          </div>
        </div>
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
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="guild-card bg-card rounded-xl p-6 border-border"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className={`text-lg font-bold mt-3 ${feature.color}`}>
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* === GAMIFICATION === */}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { name: "Sega Syndicate", icon: "🔵", color: "border-faction-sega/30 bg-faction-sega/5" },
              { name: "Nintendo Nomads", icon: "🔴", color: "border-faction-nintendo/30 bg-faction-nintendo/5" },
              { name: "Sony Sentinels", icon: "🟣", color: "border-faction-sony/30 bg-faction-sony/5" },
            ].map((faction) => (
              <div key={faction.name} className={`rounded-xl border p-6 text-center ${faction.color}`}>
                <span className="text-4xl">{faction.icon}</span>
                <h3 className="text-base font-bold text-foreground mt-3">{faction.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === PRICING === */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">
            Choose Your <span className="text-primary">Tier</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {TIERS.map((tier) => (
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
                {tier.price}
                <span className="text-sm text-muted-foreground font-normal">/mo</span>
              </p>
              <ul className="mt-4 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-primary text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className="mt-6 w-full py-2.5 rounded text-sm font-bold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">
                Deploy Guild
              </button>
            </div>
          ))}
        </div>
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
            © {new Date().getFullYear()} GuildOS. Built for retro-gaming legends.
          </p>
        </div>
      </footer>
    </div>
  );
}
