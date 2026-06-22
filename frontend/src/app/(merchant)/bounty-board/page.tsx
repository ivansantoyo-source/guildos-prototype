"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { Bounty, BountyStatus } from "@/lib/types";

// ============================================================
// BOUNTY DETAIL MODAL
// ============================================================
function BountyDetailModal({ bounty, onClose, onFulfill }: { bounty: Bounty; onClose: () => void; onFulfill: () => void }) {
  const isActive = bounty.status === "ACTIVE";
  const timeLeft = bounty.expires_at ? new Date(bounty.expires_at).getTime() - Date.now() : 0;
  const expiresInDays = Math.max(0, Math.ceil(timeLeft / 86400000));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl max-w-lg w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-5 py-3 text-xs font-bold tracking-wider flex items-center justify-between ${
          isActive ? "bg-gold/10 text-gold" : "bg-xp/10 text-xp"
        }`}>
          <span>{isActive ? "🎯 ACTIVE BOUNTY" : "✅ QUEST COMPLETE"}</span>
          <span className="text-[11px]">{bounty.platform}</span>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">{bounty.target_item_name}</h2>
              {bounty.description && <p className="text-xs text-muted-foreground mt-1 italic">&quot;{bounty.description}&quot;</p>}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-primary text-lg">✕</button>
          </div>

          {/* Value Breakdown */}
          <div className="bg-background/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Market Price</span>
              <span className="text-foreground font-mono">${bounty.base_market_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Scarcity Multiplier</span>
              <span className="text-gold font-mono font-bold">×{bounty.scarcity_mult.toFixed(2)}</span>
            </div>
            <div className="border-t border-border/50 pt-2 flex justify-between text-base font-bold">
              <span className="text-gold text-glow-gold">Store Credit Reward</span>
              <span className="text-gold text-glow-gold font-mono">${bounty.store_credit_value.toFixed(2)}</span>
            </div>
          </div>

          {/* Status Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-background/30 rounded p-2.5">
              <p className="text-muted-foreground">Status</p>
              <p className={`font-bold mt-0.5 ${isActive ? "text-primary" : "text-xp"}`}>
                {bounty.status}
              </p>
            </div>
            <div className="bg-background/30 rounded p-2.5">
              <p className="text-muted-foreground">Posted</p>
              <p className="font-bold mt-0.5 text-foreground">{new Date(bounty.created_at).toLocaleDateString()}</p>
            </div>
            {isActive && bounty.expires_at && (
              <div className="bg-background/30 rounded p-2.5">
                <p className="text-muted-foreground">Expires</p>
                <p className={`font-bold mt-0.5 ${expiresInDays <= 7 ? "text-destructive" : "text-muted-foreground"}`}>
                  {expiresInDays > 0 ? `${expiresInDays} days` : "Today"}
                </p>
              </div>
            )}
            {!isActive && bounty.fulfilled_by && (
              <div className="bg-background/30 rounded p-2.5">
                <p className="text-muted-foreground">Fulfilled By</p>
                <p className="font-bold mt-0.5 text-xp">{bounty.fulfilled_by}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isActive && (
              <button onClick={onFulfill} className="flex-1 py-2.5 text-xs rounded bg-xp text-black font-bold hover:bg-xp/90 transition-colors">
                ✅ MARK AS FULFILLED
              </button>
            )}
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="px-4 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
              🔗 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FULFILLMENT WORKFLOW MODAL
// ============================================================
function FulfillmentModal({ bounty, onClose }: { bounty: Bounty; onClose: () => void }) {
  const fulfillBounty = useGuildStore((s) => s.fulfillBounty);
  const [playerTag, setPlayerTag] = useState("");
  const [awardXp, setAwardXp] = useState(true);
  const [fulfilling, setFulfilling] = useState(false);
  const [done, setDone] = useState(false);

  const handleFulfill = () => {
    if (!playerTag.trim()) return;
    setFulfilling(true);
    setTimeout(() => {
      fulfillBounty(bounty.id, playerTag.trim());
      setFulfilling(false);
      setDone(true);
    }, 600);
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-200">
          <span className="text-5xl block mb-4">🎉</span>
          <h2 className="text-lg font-bold text-xp text-glow-green mb-2">BOUNTY FULFILLED!</h2>
          <p className="text-sm text-muted-foreground mb-2">
            {bounty.target_item_name} claimed by <span className="text-primary font-bold">{playerTag}</span>
          </p>
          {awardXp && <p className="text-xs text-xp mb-4">+250 XP awarded to {playerTag}</p>}
          <button onClick={onClose} className="px-6 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <h2 className="text-sm font-bold text-xp mb-1">✅ Fulfill Bounty</h2>
        <p className="text-xs text-muted-foreground mb-4">{bounty.target_item_name}</p>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Player who brought the item</label>
            <input
              type="text"
              value={playerTag}
              onChange={(e) => setPlayerTag(e.target.value)}
              placeholder="e.g. NEO_GEO"
              className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
              id="input-fulfill-player"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={awardXp}
              onChange={(e) => setAwardXp(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border accent-xp"
              id="check-award-xp"
            />
            <label htmlFor="check-award-xp" className="text-xs text-foreground">Award +250 XP to player</label>
          </div>

          <div className="bg-gold/5 border border-gold/10 rounded p-3">
            <p className="text-[11px] text-muted-foreground">Reward Value</p>
            <p className="text-sm text-gold font-bold font-mono">${bounty.store_credit_value.toFixed(2)} store credit</p>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              onClick={handleFulfill}
              disabled={!playerTag.trim() || fulfilling}
              className="flex-1 py-2.5 text-xs rounded bg-xp text-black font-bold hover:bg-xp/90 transition-colors disabled:opacity-50"
            >
              {fulfilling ? "Processing..." : "✅ CONFIRM FULFILLMENT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BOUNTY CREATION WIZARD
// ============================================================
function CreateBountyWizard({ onClose }: { onClose: () => void }) {
  const addBounty = useGuildStore((s) => s.addBounty);
  const inventory = useGuildStore((s) => s.inventory);

  const [step, setStep] = useState(1);
  const [itemName, setItemName] = useState("");
  const [platform, setPlatform] = useState("");
  const [searchResults, setSearchResults] = useState<typeof inventory>([]);
  const [basePrice, setBasePrice] = useState(100);
  const [multiplier, setMultiplier] = useState(1.5);
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [done, setDone] = useState(false);

  // Auto-suggest from inventory
  useEffect(() => {
    if (itemName.length < 2) { setSearchResults([]); return; }
    const q = itemName.toLowerCase();
    const results = inventory.filter((i) => i.item_name.toLowerCase().includes(q) || i.platform?.toLowerCase().includes(q));
    setSearchResults(results.slice(0, 5));
  }, [itemName, inventory]);

  // Auto-suggest price from inventory match
  useEffect(() => {
    const match = inventory.find((i) => i.item_name.toLowerCase() === itemName.toLowerCase());
    if (match) { setBasePrice(match.market_value); if (match.platform) setPlatform(match.platform); }
  }, [itemName, inventory]);

  const reset = () => { setStep(1); setItemName(""); setPlatform(""); setBasePrice(100); setMultiplier(1.5); setDescription(""); };

  const handleCreate = () => {
    if (!itemName.trim()) return;
    setIsCreating(true);
    setTimeout(() => {
      const creditValue = basePrice * multiplier;
      addBounty({
        id: `bnt-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        target_item_name: itemName.trim(),
        platform: platform || undefined,
        base_market_price: basePrice,
        scarcity_mult: multiplier,
        store_credit_value: creditValue,
        status: "ACTIVE",
        description: description || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setIsCreating(false);
      setDone(true);
    }, 600);
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-xl p-8 max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-200">
          <span className="text-5xl block mb-4">📜</span>
          <h2 className="text-lg font-bold text-gold text-glow-gold mb-2">QUEST DEPLOYED!</h2>
          <p className="text-xs text-muted-foreground">Bounty posted for {itemName}</p>
          <button onClick={onClose} className="mt-6 px-6 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
            BACK TO BOARD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-8 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Search Item */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary">Step 1: Identify Target Item</h3>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Item Name</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Mega Man X3"
                className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
                id="wizard-item-name"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Platform</label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="e.g. SNES"
                className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {/* Auto-suggest results */}
            {searchResults.length > 0 && (
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <p className="text-[10px] text-muted-foreground px-3 py-1.5 bg-card">Matching inventory items:</p>
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setItemName(item.item_name); setPlatform(item.platform || ""); setBasePrice(item.market_value); setSearchResults([]); }}
                    className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary/10 transition-colors border-t border-border/50 flex justify-between"
                  >
                    <span>{item.item_name}</span>
                    <span className="text-gold font-mono">${item.market_value.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
            {itemName.trim() && (
              <div className="bg-gold/5 border border-gold/10 rounded p-3">
                <p className="text-[10px] text-muted-foreground">Auto-suggested market price (from PriceCharting)</p>
                <p className="text-sm text-gold font-bold font-mono mt-0.5">${basePrice.toFixed(2)}</p>
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={!itemName.trim()}
              className="w-full py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              NEXT: SET REWARD →
            </button>
          </div>
        )}

        {/* Step 2: Set Price */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary">Step 2: Set Reward Parameters</h3>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Base Market Price ($)</label>
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)} className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Scarcity Multiplier</label>
              <input type="number" step="0.25" value={multiplier} onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1)} className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground" />
              <p className="text-[10px] text-muted-foreground mt-1">Higher multiplier = bigger reward incentive</p>
            </div>
            <div className="bg-gold/5 border border-gold/10 rounded p-3">
              <p className="text-[10px] text-muted-foreground">Calculated Store Credit</p>
              <p className="text-lg text-gold font-bold font-mono">${(basePrice * multiplier).toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">← BACK</button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">NEXT: CONFIRM →</button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gold">Step 3: Confirm Deployment</h3>
            <div className="bg-background/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Item</span><span className="text-foreground font-bold">{itemName}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Platform</span><span className="text-foreground">{platform || "Any"}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Base Price</span><span className="text-foreground font-mono">${basePrice.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Multiplier</span><span className="text-gold font-mono">×{multiplier.toFixed(2)}</span></div>
              <div className="border-t border-border/50 pt-2 flex justify-between text-sm font-bold">
                <span className="text-gold text-glow-gold">Final Reward</span>
                <span className="text-gold text-glow-gold font-mono">${(basePrice * multiplier).toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Description (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Why is this item wanted?" className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">← BACK</button>
              <button onClick={handleCreate} disabled={isCreating} className="flex-1 py-2.5 text-xs rounded bg-xp text-black font-bold hover:bg-xp/90 transition-colors disabled:opacity-50">
                {isCreating ? "DEPLOYING..." : "📌 DEPLOY QUEST"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// BOUNTY CARD
// ============================================================
function BountyCard({ bounty, onClick }: { bounty: Bounty; onClick: () => void }) {
  const isFulfilled = bounty.status === "FULFILLED";
  const isExpired = bounty.status === "EXPIRED";
  const isActive = bounty.status === "ACTIVE";

  // Countdown calculation
  const expiresAt = bounty.expires_at ? new Date(bounty.expires_at).getTime() : null;
  const timeLeft = expiresAt ? expiresAt - Date.now() : 0;
  const expiresInDays = Math.max(0, Math.ceil(timeLeft / 86400000));
  const isExpiringSoon = isActive && expiresInDays <= 7;

  return (
    <div
      onClick={onClick}
      className={`guild-card bg-card rounded-lg overflow-hidden cursor-pointer ${
        isFulfilled ? "opacity-70 border-xp/20" :
        isExpired ? "opacity-50 border-muted/20" :
        "border-gold/20"
      }`}
    >
      <div className={`px-4 py-2 text-xs font-bold tracking-wider flex items-center justify-between ${
        isFulfilled ? "bg-xp/10 text-xp" :
        isExpired ? "bg-muted/10 text-muted-foreground" :
        "bg-gold/10 text-gold"
      }`}>
        <span>{isFulfilled ? "✅ QUEST COMPLETE" : isExpired ? "⌛ EXPIRED" : "🎯 ACTIVE BOUNTY"}</span>
        {isExpiringSoon && <span className="text-[10px] text-destructive animate-spike-flash">EXPIRING!</span>}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-foreground">{bounty.target_item_name}</h3>
          </div>
          {bounty.platform && <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">{bounty.platform}</span>}
        </div>

        {bounty.description && <p className="text-xs text-muted-foreground italic">&quot;{bounty.description}&quot;</p>}

        <div className="bg-background/50 rounded p-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Base Market Price</span>
            <span className="text-foreground font-mono">${bounty.base_market_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Scarcity Multiplier</span>
            <span className="text-gold font-mono">×{bounty.scarcity_mult.toFixed(2)}</span>
          </div>
          <div className="border-t border-border/50 pt-1 flex justify-between text-sm font-bold">
            <span className="text-gold">Store Credit</span>
            <span className="text-gold text-glow-gold font-mono">${bounty.store_credit_value.toFixed(2)}</span>
          </div>
        </div>

        {/* Countdown */}
        {isActive && expiresAt && (
          <p className={`text-[11px] ${isExpiringSoon ? "text-destructive font-bold" : "text-muted-foreground"}`}>
            ⏰ {expiresInDays > 0 ? `${expiresInDays} days remaining` : "Expires today!"}
          </p>
        )}
        {isFulfilled && bounty.fulfilled_by && (
          <p className="text-[11px] text-xp">✓ Fulfilled by {bounty.fulfilled_by}</p>
        )}
        {isExpired && (
          <p className="text-[11px] text-muted-foreground">⌛ This bounty has expired</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN BOUNTY BOARD PAGE
// ============================================================
export default function BountyBoardPage() {
  const bounties = useGuildStore((s) => s.bounties);
  const [showForm, setShowForm] = useState(false);
  const [showFulfill, setShowFulfill] = useState<string | null>(null);
  const [detailBounty, setDetailBounty] = useState<Bounty | null>(null);
  const addBounty = useGuildStore((s) => s.addBounty);
  const [sortBy, setSortBy] = useState<"reward" | "newest" | "expiring">("newest");
  const [activeTab, setActiveTab] = useState<BountyStatus | "ACTIVE" | "FULFILLED" | "EXPIRED">("ACTIVE");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const activeBounties = bounties.filter((b) => b.status === "ACTIVE");
  const fulfilledBounties = bounties.filter((b) => b.status === "FULFILLED");
  const expiredBounties = bounties.filter((b) => b.status === "EXPIRED");

  const displayBounties = useMemo(() => {
    let items: Bounty[];
    switch (activeTab) {
      case "FULFILLED": items = [...fulfilledBounties]; break;
      case "EXPIRED": items = [...expiredBounties]; break;
      default: items = [...activeBounties]; break;
    }

    switch (sortBy) {
      case "reward": items.sort((a, b) => b.store_credit_value - a.store_credit_value); break;
      case "expiring":
        items.sort((a, b) => {
          const aExp = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
          const bExp = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
          return aExp - bExp;
        });
        break;
      case "newest":
      default: items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return items;
  }, [bounties, activeTab, sortBy, activeBounties, fulfilledBounties, expiredBounties]);

  const handleShareBounty = useCallback((bounty: Bounty) => {
    const text = `📜 GUILDOS BOUNTY: ${bounty.target_item_name} — Reward: $${bounty.store_credit_value.toFixed(2)} store credit`;
    navigator.clipboard.writeText(text);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="flex gap-1 border-b border-border pb-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-7 w-24 bg-muted rounded animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="guild-card bg-card rounded-lg overflow-hidden animate-pulse">
              <div className="h-8 bg-muted/50" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-20 bg-muted/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">📜 THE QUEST BOARD</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {activeBounties.length} active bounties · Community-sourced supply chain
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          id="btn-post-bounty"
        >
          {showForm ? "✕ Cancel" : "📌 POST BOUNTY"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button onClick={() => setActiveTab("ACTIVE")} className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${activeTab === "ACTIVE" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Active ({activeBounties.length})
        </button>
        <button onClick={() => setActiveTab("FULFILLED")} className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${activeTab === "FULFILLED" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Fulfilled ({fulfilledBounties.length})
        </button>
        <button onClick={() => setActiveTab("EXPIRED")} className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${activeTab === "EXPIRED" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Expired ({expiredBounties.length})
        </button>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground uppercase">Sort by:</span>
        <div className="flex gap-1">
          {([["reward", "💰 Reward"], ["newest", "🕐 Newest"], ["expiring", "⏰ Expiring Soon"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-2 py-1 text-[11px] rounded transition-all ${
                sortBy === key ? "bg-primary/20 border border-primary/40 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Bounty Wizard */}
      {showForm && <CreateBountyWizard onClose={() => setShowForm(false)} />}

      {/* Empty States */}
      {displayBounties.length === 0 && activeTab === "ACTIVE" && (
        <div className="guild-card bg-card rounded-lg p-12 text-center border-border/20">
          <span className="text-5xl block mb-4">📜</span>
          <h2 className="text-lg font-bold text-primary mb-2">No Active Bounties</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Your quest board is empty. Create your first bounty to mobilize your community to find rare items.
          </p>
          <button onClick={() => setShowForm(true)} className="px-6 py-3 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
            📌 CREATE YOUR FIRST BOUNTY
          </button>
        </div>
      )}

      {displayBounties.length === 0 && activeTab === "EXPIRED" && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">⌛</p>
          <p>No expired bounties.</p>
        </div>
      )}

      {displayBounties.length === 0 && activeTab === "FULFILLED" && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">✅</p>
          <p>No fulfilled bounties yet. The first one&apos;s always special.</p>
        </div>
      )}

      {/* Bounty Grid */}
      {displayBounties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayBounties.map((bounty) => (
            <div key={bounty.id} className="relative">
              {/* Share button overlay */}
              <button
                onClick={(e) => { e.stopPropagation(); handleShareBounty(bounty); }}
                className="absolute top-2 right-2 z-10 w-6 h-6 rounded bg-background/80 border border-border flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                title="Copy bounty link"
              >
                🔗
              </button>
              <BountyCard
                bounty={bounty}
                onClick={() => setDetailBounty(bounty)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Expired tab: Repost action */}
      {activeTab === "EXPIRED" && displayBounties.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Want to repost an expired bounty?</p>
          {displayBounties.slice(0, 1).map((bounty) => (
            <button
              key={bounty.id}
              onClick={() => {
                addBounty({
                  ...bounty,
                  id: `bnt-${Date.now()}`,
                  status: "ACTIVE",
                  fulfilled_by: undefined,
                  fulfilled_at: undefined,
                  expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }}
              className="px-4 py-2 text-xs rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
            >
              🔄 Repost &quot;{bounty.target_item_name}&quot;
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailBounty && (
        <BountyDetailModal
          bounty={detailBounty}
          onClose={() => setDetailBounty(null)}
          onFulfill={() => { setShowFulfill(detailBounty.id); setDetailBounty(null); }}
        />
      )}

      {/* Fulfillment Modal */}
      {showFulfill && (() => {
        const bounty = bounties.find((b) => b.id === showFulfill);
        if (!bounty) return null;
        return <FulfillmentModal bounty={bounty} onClose={() => setShowFulfill(null)} />;
      })()}
    </div>
  );
}
