
1. System Architecture & Multi-Tenant Infrastructure
GuildOS is a multi-tenant Software-as-a-Service (SaaS) platform engineered as a distributed, real-time ecosystem. Every brick-and-mortar storefront represents an isolated tenant instance ("Server"), while a shared global network enables inter-store data aggregation and cross-play mechanics.
Tenant Isolation & Subdomain Routing
Routing Engine: Dynamically handle wildcard subdomains (*.guildos.com) at the middleware layer using Vercel Platforms Starter patterns.
Tenant Resolution: Middleware extracts the host header, queries the centralized tenant cache, and rewrites the internal URL structure to app/[tenant]/... seamlessly.
Custom Domain Mapping: Allow CNAME record mapping at the apex domain, managed via Vercel's Domain API.
Database Design & Row-Level Security (RLS)
The platform operates on a single high-density PostgreSQL database. Multi-tenancy is enforced at the database layer via Supabase Row-Level Security (RLS) policies. Every table containing business data must include a tenant_id column.
SQL

-- Core RLS Enforcements PolicyALTER TABLE inventory ENABLE ROW LEVEL SECURITY;CREATE POLICY tenant_isolation_policy ON inventory
    FOR ALL
    USING (tenant_id = auth.jwt() ->> 'tenant_id')
    WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');
2. Core Module Specifications
Module 1: The "Loot Scanner" & Real-World RNG (Inventory)
Transforms manual physical retail data entry into a automated, gamified inventory ingest system.
[Mobile Portal UI] -> [Camera Capture] -> [Cloud Storage Buckets]
                                                 │
 [RPG Admin Dashboard] <- [Auto-Appraiser Engine] ◄┘
 (Outputs "Gold/Loot")           │
                          [PriceCharting API]
                                 │
                     [Webhooks: IoT Triggers] -> [Govee Smart LED / Audio]
The AI Vision Integrator: Mobile-first frontend camera upload utility. Captures a single image or multi-item grid arrays of physical game cartridges or hardware. Images stream directly to an isolated cloud bucket via signed URLs.
The Auto-Appraiser Engine: Cloud function triggers upon bucket upload. Images feed to a computer vision model to run optical character recognition (OCR) and item classification. The payload queries the PriceCharting API to extract live market prices based on condition parameters: Loose, CIB (Complete in Box), or New.
The Scrap Yard Matrix: Inventory schema must support a Junk or Scrap conditional status flag. Items marked as Scrap undergo a localized hardware depreciation calculation (e.g., base unit value minus standard laser lens/power component replacement costs). The interface maps these as "Harvestable Mats" for sale to local modders.
Dynamic Algorithmic Pricing: Cron job executing at 04:00 UTC daily. Pulls standard market fluctuation vectors from secondary market APIs. If an asset spikes $\ge 15\%$, the item triggers a critical state flag in the admin view: [!] PRICE SPIKE: Adjust Sticker Price.
IoT Webhook System: When a scanned item qualifies as a "Grail" (Market Value $\ge \$150.00$), a POST request fires to an external automation controller (e.g., Make/Zapier connected to Govee/Philips Hue APIs and a localized smart speaker).
JSON

{
  "event": "loot_drop_legendary",
  "tenant_id": "tenant_time_warp_01",
  "item_name": "EarthBound (SNES)",
  "market_value": 350.00,
  "action_payload": {
    "light_hex": "#FFD700",
    "light_pulse_ms": 3000,
    "audio_url": "https://cdn.guildos.com/assets/sfx/legendary_drop.mp3"
  }
}
The Merchant Dashboard: A high-density dashboard featuring custom CSS thematic skinning to replace standard e-commerce elements:
Daily Gross Revenue $\rightarrow$ Gold Farmed
High-Value Inventory Capture $\rightarrow$ Legendary Item Acquired
Out-of-Stock Status $\rightarrow$ Loot Depleted
Module 2: "The Bounty Board" & Faction Systems (Supply Chain)
Implements an automated, community-sourced supply chain utilizing behavioral game design.
       [Global Admin Console]
                 │
      (Defines Target Items)
                 │
                 ▼
     [Dynamic Quest Board UI] ──(Pledge Loyalty)──► [Faction War Matrix]
(Bounties, Multipliers, XP Logic)               (Sega Syndicate / Nintendo Nomads)
                 │                                       │
         [User Profiles] ◄────────(Earn Points)──────────┘
  (Levels: Peasant to Time Lord)
The Live Quest Board: Public-facing dashboard listing high-demand inventory needs configured by the storefront owner. Bounties dynamically calculate store credit value using the formula:
$$\text{Bounty Value} = (\text{Base Market Price} \times \text{Scarcity Multiplier})$$
Player Leveling System: Customer schemas track comprehensive interactions via an experience points (XP) calculation model.
Player TierXP ThresholdPermanent Store Account PerkTier 1: Peasant0 XPStandard Account DefaultsTier 2: Retro Mage5,000 XP+5% Added to all Trade-In ValuationsTier 3: Time Lord25,000 XPEarly access to high-value drops; Free "Save Room" Entry
The Faction War Matrix: Upon user registration, accounts must select a static faction flag (Sega Syndicate, Nintendo Nomads, Sony Sentinels).
Transactional values add metadata tokens to the global tenant pool: Faction Points = Total Transaction USD.
A store-wide cron job checks rankings on the final day of the calendar month at 23:59:59.
The platform automatically applies a global database rule configuring a 10% discount profile for the winning faction's corresponding inventory tags for the subsequent 30 days.
The "Wandering Merchant" Quest: Geo-fenced broadcast utility. Allows store administrators to push an active coordinate pin via mobile app. Pushing the location triggers an SMS workflow (via Twilio) to users within a 25-mile radius containing the active coordinates and a conditional validation string ("Secret Password").
Module 3: "The Nexus" (Physical Space Monetization)
A localized community engagement platform to manage and monetize physical storefront space.
Looking For Group (LFG) Matchmaker: Peer-to-peer digital bulletin board. Users initiate lobby records (game_title, player_slots_total, player_slots_filled, start_time). Other verified local accounts can hit an endpoint to join the active room array.
The "Save Room" Portal: Space-rental subscription module. Manages room utilization allocations (CRT displays, couches, premium networks).
Integrates with Stripe Billing engine to charge a recurring monthly subscription ($15/mo default).
Generates an encrypted dynamic QR code via the customer dashboard to grant access to physical automated entry doors.
The "Ghost Data" Leaderboard: Store administrators can input arcade cabinets or localized challenge score matrices directly into the dashboard.
Markdown

### LOCAL LEGENDS SCOREBOARD: PAC-MAN (Cabinet A)
| Rank | Player Tag | Score | Date Logged | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | TRON_99 | 1,245,500 | 2026-06-12 | Active Champion |
| 2 | NEO_GEO | 1,120,000 | 2026-06-20 | Knocked to #2 |
Automated Retaliation Triggers: When Player A inputs a score that overrides Player B's position on the database, a database webhook triggers an instant SMS notification to Player B: [GUILDOS] Outclassed! Your #1 spot on Pac-Man has been stolen by TRON_99. Return to the Nexus to reclaim your title.
Module 4: The Synthetic Shopkeeper (AI Architecture)
DeepSeek-V3 orchestration layer operating as a conversational frontend shopkeeper.
                  [Next.js App Frontend User Query]
                                  │
                                  ▼
                     [Secure Edge API Route Layer]
               (Injects System Prompt + Current JSON State)
                                  │
                                  ▼
                     [NVIDIA NIM DeepSeek Engine]
                                  │
        ┌─────────────────────────┴─────────────────────────┐
        ▼                                                   ▼
[Inventory Queries]                               [The Oracle Predictive Logic]
("We have Ecco in stock")                       (Matches JRPG tag -> Outbound SMS)
Secure API Orchestration: Client chat strings process through a protected Next.js edge route. The route pulls the active store's real-time inventory schema, transforms it into a minified text-based matrix, and drops it into the system payload context window before contacting the model endpoint.
System Core Configuration Prompt:
Plaintext

You are an automated, highly advanced retro-gaming clerk running inside GuildOS. You possess absolute encyclopedic knowledge of video game software, hardware variants, and history. Your voice is witty, authentic, slightly nerdy, and deeply respectful of vintage tech. You must analyze the provided JSON inventory payload of the current store. If asked about stock, query the payload. If an item is absent, check external market patterns to recommend a trade-in bounty value. Never hallucinate store availability.
*   **The Oracle Predictive Engine:** Daily analytical background process. Matches customer user purchase vectors against newly acquired inventory inventory data tags. If user `ID_902` shows extensive activity history with tag `JRPG` and a trade-in receipt registers item `Chrono Cross (PS1)` to the local shelf state, an instant outbounds notification fires:

```text
[THE ORACLE] A traveler has just sold a pristine copy of Chrono Cross. The patterns indicate this belongs in your collection. Reply YES within 2 hours to hold this item at the counter.
Viral Architecture (The Konami Code): Implement a client-side global DOM keyboard event listener.
JavaScript

// Konami Code Event Patternconst konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];let inputBuffer = [];window.addEventListener('keydown', (e) => {
  inputBuffer.push(e.key);
  inputBuffer = inputBuffer.slice(-konamiSequence.length);
  if (JSON.stringify(inputBuffer) === JSON.stringify(konamiSequence)) {
    triggerSecretCheatMode();
  }
});
UI Execution Event: Triggering the sequence flashes the active browser viewport neon green and injects a single-use 10% discount code dynamically generated by the tenant's promotional engine directly into the user interface.
3. The Cross-Play Network (Inter-Store Ecosystem)
1. Inter-Guild Trade Routes (B2B Arbitrage)
Automated B2B distribution layer balancing local market anomalies.
The Rule: If a tenant posts an active item on their "Bounty Board" and it remains unfulfilled for $> 14 \text{ days}$, the platform triggers a cross-tenant inventory lookup workflow.
The Execution: The system automatically locates any alternate tenant matching the criteria where Stock Count \ge 3 for that exact asset. It presents a B2B wholesale transaction proposal sheet within the admin consoles of both locations, allowing automated invoicing and secure shipping manifest generation via standard courier APIs.
2. The Global Blacklist Security Layer
An encrypted, zero-knowledge threat mitigation ledger designed to eliminate fraud and regional property theft.
The Workflow: When a store owner logs a fraudulent transaction attempt (e.g., identity mismatch, verified counterfeit cartridge, or suspicious bulk trade-in indicative of theft), the operator registers a record on the dashboard.
The Broadcast: The system hashes the suspect's driver's license/ID metadata string and geolocation metrics. It pushes an immediate high-priority warning payload to the Synthetic Shopkeeper backend configuration files of all alternative tenants operating within a strict 100-mile spatial radius.
4. Multi-Tenant Database Schema Core
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     tenants     │       │    inventory    │       │     profiles    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄─────┐│ id (PK)         │      ┌│ id (PK)         │
│ company_name    │      ││ tenant_id (FK)  │      ││ tenant_id (FK)  │
│ subdomain       │      └│ item_name       │      ││ display_name    │
└─────────────────┘       │ market_value    │      ││ faction         │
                          │ condition       │      ││ xp_points       │
                          └─────────────────┘      └─────────────────┘
                                   ▲                         ▲
┌─────────────────┐                │                         │
│    bounties     │                │                         │
├─────────────────┤                │                         │
│ id (PK)         │                │                         │
│ tenant_id (FK)  │────────────────┘                         │
│ target_item_name│                                          │
└─────────────────┘                                          │
                                                             │
┌─────────────────┐                                          │
│   nexus_lfgs    │                                          │
├─────────────────┤                                          │
│ id (PK)         │                                          │
│ tenant_id (FK)  │                                          │
│ creator_id (FK) ───────────────────────────────────────────┘
│ lobby_status    │
└─────────────────┘
1. Tenants Table
Column NameData TypeConstraintsDescriptioniduuidPrimary Key, default gen_random_uuid()Unique tenant identifiercompany_namevarchar(255)Not NullCorporate operating entity namesubdomainvarchar(63)Unique, Not NullTarget routing stringcreated_attimestamptzdefault now()Registration timestamp
2. Inventory Table
Column NameData TypeConstraintsDescriptioniduuidPrimary KeyUnique object identifiertenant_iduuidForeign Key $\rightarrow$ tenants.idOwner sandbox indicatoritem_namevarchar(255)Not NullEvaluated title indexing stringmarket_valuenumeric(10,2)Not NullPriceCharting cached sync valueconditionvarchar(50)Not NullNew, CIB, Loose, Scrapstock_countintegerdefault 1Quantity on shelf
3. Profiles (User Accounts) Table
Column NameData TypeConstraintsDescriptioniduuidPrimary KeyAccount referencetenant_iduuidForeign Key $\rightarrow$ tenants.idRegistered home locationdisplay_namevarchar(100)Not NullIn-game handle/Gamertagfactionvarchar(50)Check ConstraintSega, Nintendo, Sonyxp_pointsintegerdefault 0System level indicator metrics
4. Bounties Table
Column NameData TypeConstraintsDescriptioniduuidPrimary KeyRecord tracking keytenant_iduuidForeign Key $\rightarrow$ tenants.idStore requesting the itemtarget_item_namevarchar(255)Not NullName of desired titlescarcity_multnumeric(3,2)default 1.00Multiplier offered for item
5. Nexus LFGs Table
Column NameData TypeConstraintsDescriptioniduuidPrimary KeyLobby tracking keytenant_iduuidForeign Key $\rightarrow$ tenants.idStore location hosting eventcreator_iduuidForeign Key $\rightarrow$ profiles.idUser organizing the sessionlobby_statusvarchar(50)default 'open'open, filled, completed
5. Monetization Tier Enforcement Setup
The application tracks operational boundaries based on explicit tier subscription verification fields on the Tenant record.
JSON

{
  "tier_configurations": {
    "merchant_tier": {
      "monthly_fee_usd": 99.00,
      "features_enabled": ["rpg_admin_dashboard", "local_seo_hardening", "base_inventory_engine"]
    },
    "wizard_tier": {
      "monthly_fee_usd": 249.00,
      "features_enabled": ["deepseek_synthetic_shopkeeper", "vision_loot_scanner", "automated_sms_marketing"]
    },
    "time_lord_tier": {
      "monthly_fee_usd": 499.00,
      "features_enabled": ["inter_guild_trade_network", "automated_corporate_b2b_engine", "unlimited_nexus_access"]
    }
  }
}
6. Execution & Deployment Roadmap
┌────────────────────────────────────────────────────────┐
│ PHASE 1: Alpha Server Build (Days 1 - 14)               │
│ ──► Build core multi-tenant backend architecture.      │
│ ──► Establish functional DeepSeek API routing proxy.    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 2: Live Beta Sandbox (Days 15 - 30)              │
│ ──► Deploy directly at Time Warp Gaming storefront.    │
│ ──► Record live user interaction capture video clips.  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 3: SaaS Shell Core Rollout (Days 31+)            │
│ ──► Launch parent multi-tenant landing platform page.   │
│ ──► Pipe live operational video into page background.  │
└────────────────────────────────────────────────────────┘