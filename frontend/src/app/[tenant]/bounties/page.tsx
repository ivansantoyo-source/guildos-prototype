"use client";

import React, { useState, useMemo } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import BountyLeaderboard from "@/components/bounties/leaderboard";
import { calculateSpread } from "@/lib/arbitrage/engine";
import type { Bounty, BountyStats } from "@/lib/types";

// ============================================================
// CLAIM MODAL — Customer-facing "Claim This Bounty" flow
// ============================================================
function ClaimModal({
  bounty,
  profileId,
  onClose,
}: {
  bounty: Bounty;
  profileId: string;
  onClose: () => void;
}) {
  const claimBounty = useGuildStore((s) => s.claimBounty);
  const profiles = useGuildStore((s) => s.user ? [s.user] : []);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [hunterTag, setHunterTag] = useState(
    profiles.find((p) => p.id === profileId)?.display_name || "HUNTER"
  );

  const handleClaim = () => {
    setConfirming(true);
    setTimeout(() => {
      claimBounty(bounty.id, profileId, hunterTag);
      setConfirming(false);
      setDone(true);
    }, 600);
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-200">
          <span className="text-5xl block mb-4">🎯</span>
          <h2 className="text-lg font-bold text-gold text-glow-gold mb-2">BOUNTY CLAIMED!</h2>
          <p className="text-sm text-muted-foreground mb-2">
            You claimed <span className="text-primary font-bold">{bounty.target_item_name}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Find the item at your local shop and bring it to the counter.
            Status: <span className="text-xp font-bold">IN TRANSIT → RECEIVED → VERIFIED → PAID</span>
          </p>
          <button onClick={onClose} className="px-6 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
            BACK TO MARKETPLACE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <h2 className="text-sm font-bold text-gold mb-1">🎯 Claim This Bounty</h2>
        <p className="text-xs text-muted-foreground mb-4">{bounty.target_item_name}</p>

        <div className="bg-background/50 rounded-lg p-4 space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Reward</span>
            <span className="text-gold font-bold font-mono">${bounty.store_credit_value.toFixed(2)} store credit</span>
          </div>
          {bounty.platform && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Platform</span>
              <span className="text-foreground">{bounty.platform}</span>
            </div>
          )}
          {bounty.description && (
            <div className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/30">
              &quot;{bounty.description}&quot;
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Your Hunter Tag</label>
            <input
              type="text"
              value={hunterTag}
              onChange={(e) => setHunterTag(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground"
            />
          </div>

          <div className="bg-xp/5 border border-xp/10 rounded p-3">
            <p className="text-[10px] text-muted-foreground">By claiming, you agree to deliver the item to the shop within 14 days. Your reputation score increases on successful delivery.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              onClick={handleClaim}
              disabled={confirming || !hunterTag.trim()}
              className="flex-1 py-2.5 text-xs rounded bg-gold text-black font-bold hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {confirming ? "Claiming..." : "🎯 CLAIM BOUNTY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BOUNTY MARKETPLACE CARD (customer-facing)
// ============================================================
function MarketplaceCard({
  bounty,
  onClaim,
}: {
  bounty: Bounty;
  onClaim: () => void;
}) {
  const isLimitBuy = bounty.order_type === "LIMIT_BUY";
  const isLimitSell = bounty.order_type === "LIMIT_SELL";
  const orderIcon = isLimitBuy ? "📈" : isLimitSell ? "📉" : "🎯";
  const orderLabel = isLimitBuy ? "Limit Buy" : isLimitSell ? "Limit Sell" : "Bounty";

  const spread = calculateSpread(bounty.base_market_price, bounty.trigger_price || bounty.base_market_price);

  return (
    <div className="guild-card bg-card border border-primary/20 rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(57,255,20,0.15)] transition-all duration-300 group">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 flex items-center justify-between border-b border-primary/10">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{orderIcon}</span>
          <span className="text-[10px] font-bold text-primary tracking-wider">{orderLabel}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{bounty.platform || "Any"}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Item Name */}
        <div>
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {bounty.target_item_name}
          </h3>
          {bounty.description && (
            <p className="text-[11px] text-muted-foreground italic mt-1">&quot;{bounty.description}&quot;</p>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="bg-background/50 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Market Value</span>
            <span className="text-foreground font-mono">${bounty.base_market_price.toFixed(2)}</span>
          </div>
          {isLimitBuy && bounty.trigger_price && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Max Price</span>
              <span className="text-primary font-mono">≤ ${bounty.trigger_price.toFixed(2)}</span>
            </div>
          )}
          {(isLimitBuy || isLimitSell) && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Spread</span>
              <span className={`font-mono ${spread.profitable ? "text-xp" : "text-muted-foreground"}`}>
                {spread.spreadPct.toFixed(1)}%
              </span>
            </div>
          )}
          <div className="border-t border-border/50 pt-1.5 flex justify-between">
            <span className="text-sm text-gold font-bold">Reward</span>
            <span className="text-sm text-gold font-bold font-mono text-glow-gold">
              ${bounty.store_credit_value.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={onClaim}
          className="w-full py-2.5 text-xs rounded bg-gold/20 border border-gold/30 text-gold font-bold hover:bg-gold/30 hover:border-gold/50 transition-all"
        >
          🎯 CLAIM THIS BOUNTY
        </button>
      </div>
    </div>
  );
}

// ============================================================
// HUNTER DASHBOARD
// ============================================================
function HunterDashboard({
  bountyStats,
  profileId,
}: {
  bountyStats: BountyStats[];
  profileId: string;
}) {
  const myStats = bountyStats.find((s) => s.profile_id === profileId);

  if (!myStats) {
    return (
      <div className="guild-card bg-card border border-xp/20 rounded-xl overflow-hidden">
        <div className="bg-xp/10 px-4 py-3 border-b border-xp/10">
          <h3 className="text-sm font-bold text-xp">🎯 Your Hunter Dashboard</h3>
        </div>
        <div className="p-6 text-center">
          <span className="text-3xl block mb-2">🏹</span>
          <p className="text-sm text-foreground font-bold mb-1">Not a bounty hunter yet?</p>
          <p className="text-xs text-muted-foreground">Claim your first bounty above to start earning reputation and store credit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guild-card bg-card border border-xp/20 rounded-xl overflow-hidden">
      <div className="bg-xp/10 px-4 py-3 border-b border-xp/10">
        <h3 className="text-sm font-bold text-xp">🎯 {myStats.hunter_tag}&apos;s Dashboard</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background/50 rounded p-2.5 text-center">
            <p className="text-lg font-bold text-xp">{myStats.total_fulfilled}</p>
            <p className="text-[10px] text-muted-foreground">Fulfilled</p>
          </div>
          <div className="bg-background/50 rounded p-2.5 text-center">
            <p className="text-lg font-bold text-gold">${myStats.total_earned.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Earned</p>
          </div>
          <div className="bg-background/50 rounded p-2.5 text-center">
            <p className="text-lg font-bold text-primary">{myStats.current_claims}</p>
            <p className="text-[10px] text-muted-foreground">Active Claims</p>
          </div>
          <div className="bg-background/50 rounded p-2.5 text-center">
            <p className="text-lg font-bold text-gold">{myStats.reputation_score}</p>
            <p className="text-[10px] text-muted-foreground">Reputation</p>
          </div>
        </div>
        {myStats.avg_fulfillment_time_hours && (
          <div className="bg-muted/30 rounded p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Avg Fulfillment Time</p>
            <p className="text-xs font-bold text-foreground">{myStats.avg_fulfillment_time_hours.toFixed(1)} hours</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN CUSTOMER BOUNTY MARKETPLACE PAGE
// ============================================================
export default function TenantBountiesPage({ params }: { params: { tenant: string } }) {
  const tenant = params.tenant;

  const bounties = useGuildStore((s) => s.bounties);
  const bountyStats = useGuildStore((s) => s.bountyStats);
  const profileId = useGuildStore((s) => s.user?.id || "usr-001");
  const [claimTarget, setClaimTarget] = useState<Bounty | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"reward" | "newest">("newest");
  const [filterOrderType, setFilterOrderType] = useState<string>("ALL");

  // Get only active bounties/limit orders
  const activeBounties = bounties.filter(
    (b) => b.status === "ACTIVE" && b.fulfillment_status === "OPEN"
  );

  // Filter and sort
  const displayedBounties = useMemo(() => {
    let items = [...activeBounties];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        (b) =>
          b.target_item_name.toLowerCase().includes(q) ||
          (b.platform && b.platform.toLowerCase().includes(q))
      );
    }

    // Order type filter
    if (filterOrderType !== "ALL") {
      if (filterOrderType === "BOUNTY") {
        items = items.filter((b) => !b.order_type || b.order_type === "BOUNTY");
      } else {
        items = items.filter((b) => b.order_type === filterOrderType);
      }
    }

    // Sort
    switch (sortBy) {
      case "reward":
        items.sort((a, b) => b.store_credit_value - a.store_credit_value);
        break;
      case "newest":
      default:
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    return items;
  }, [activeBounties, searchTerm, sortBy, filterOrderType]);

  return (
    <div id="main-content" className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary text-glow-green">🎯 The Bounty Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tenant ? `${tenant.replace(/-/g, " ")}'s` : ""} marketplace &mdash; Fulfill quests and earn store credit
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search bounties..."
                  className="w-full px-3 py-2.5 text-sm bg-card border border-border rounded-xl guild-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterOrderType}
                  onChange={(e) => setFilterOrderType(e.target.value)}
                  className="px-3 py-2.5 text-xs bg-card border border-border rounded-xl guild-input text-foreground"
                >
                  <option value="ALL">All Types</option>
                  <option value="BOUNTY">🎯 Bounties</option>
                  <option value="LIMIT_BUY">📈 Limit Buys</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "reward" | "newest")}
                  className="px-3 py-2.5 text-xs bg-card border border-border rounded-xl guild-input text-foreground"
                >
                  <option value="newest">Newest</option>
                  <option value="reward">Highest Reward</option>
                </select>
              </div>
            </div>

            {/* Bounty Grid */}
            {displayedBounties.length === 0 ? (
              <div className="guild-card bg-card rounded-xl p-12 text-center border-border/20">
                <span className="text-5xl block mb-4">📜</span>
                <h2 className="text-lg font-bold text-primary mb-2">No Active Bounties Right Now</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Check back later for new quests. In the meantime, check the scoreboards or join an LFG lobby!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedBounties.map((bounty) => (
                  <MarketplaceCard
                    key={bounty.id}
                    bounty={bounty}
                    onClaim={() => setClaimTarget(bounty)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Leaderboard + Dashboard */}
          <div className="space-y-4">
            <HunterDashboard bountyStats={bountyStats} profileId={profileId} />
            <BountyLeaderboard
              hunters={bountyStats}
              currentProfileId={profileId}
            />
          </div>
        </div>

        {/* Claim Modal */}
        {claimTarget && (
          <ClaimModal
            bounty={claimTarget}
            profileId={profileId}
            onClose={() => setClaimTarget(null)}
          />
        )}
      </div>
    </div>
  );
}
