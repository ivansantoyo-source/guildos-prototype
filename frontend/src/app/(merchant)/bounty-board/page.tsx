"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { calculateSpread } from "@/lib/arbitrage/engine";
import type { Bounty, BountyStatus, FulfillmentStatus, OrderType } from "@/lib/types";
import type { SpreadResult } from "@/lib/arbitrage/engine";

// ============================================================
// FULFILLMENT PIPELINE STEPPER
// ============================================================
const PIPELINE_STEPS: { key: FulfillmentStatus; label: string; icon: string }[] = [
  { key: "CLAIMED", label: "Claimed", icon: "🤝" },
  { key: "IN_TRANSIT", label: "In Transit", icon: "📦" },
  { key: "RECEIVED", label: "Received", icon: "📥" },
  { key: "VERIFIED", label: "Verified", icon: "✅" },
  { key: "PAID", label: "Paid", icon: "💰" },
];

const FULFILLMENT_ORDER: FulfillmentStatus[] = ["OPEN", "CLAIMED", "IN_TRANSIT", "RECEIVED", "VERIFIED", "PAID", "DISPUTED"];

function getNextPipelineStep(current: FulfillmentStatus | undefined): FulfillmentStatus | null {
  const idx = FULFILLMENT_ORDER.indexOf(current || "OPEN");
  if (idx < 0 || idx >= FULFILLMENT_ORDER.length - 1) return null;
  return FULFILLMENT_ORDER[idx + 1];
}

function PipelineStepper({ bounty }: { bounty: Bounty }) {
  const updateFulfillmentStatus = useGuildStore((s) => s.updateFulfillmentStatus);
  const currentStatus = bounty.fulfillment_status || "OPEN";
  const currentIdx = FULFILLMENT_ORDER.indexOf(currentStatus);
  const nextStep = getNextPipelineStep(currentStatus);
  const isComplete = currentStatus === "PAID" || bounty.status === "FULFILLED";
  const isDisputed = currentStatus === "DISPUTED";

  if (isComplete) {
    return (
      <div className="bg-xp/10 border border-xp/20 rounded-lg p-3 text-center">
        <span className="text-lg block mb-1">🎉</span>
        <p className="text-xs text-xp font-bold">BOUNTY FULFILLED & PAID</p>
        {bounty.fulfilled_at && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Completed {new Date(bounty.fulfilled_at).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }

  if (isDisputed) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
        <span className="text-lg block mb-1">⚠️</span>
        <p className="text-xs text-destructive font-bold">DISPUTED</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {PIPELINE_STEPS.map((step, idx) => {
          const stepIdx = FULFILLMENT_ORDER.indexOf(step.key);
          const isActive = stepIdx <= currentIdx;
          const isCurrent = step.key === currentStatus;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  isCurrent
                    ? "bg-gold text-black font-bold ring-2 ring-gold/50 ring-offset-1 ring-offset-card"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {step.icon}
                </div>
                <span className={`text-[8px] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {idx < PIPELINE_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mt-[-12px] ${isActive ? "bg-primary" : "bg-muted"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {nextStep && (
        <button
          onClick={() => updateFulfillmentStatus(bounty.id, nextStep)}
          className="w-full py-1.5 text-[10px] rounded bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition-colors"
        >
          Advance to {PIPELINE_STEPS.find((s) => s.key === nextStep)?.label || nextStep}
        </button>
      )}
    </div>
  );
}

// ============================================================
// BOUNTY DETAIL MODAL (enhanced with pipeline stepper)
// ============================================================
function BountyDetailModal({ bounty, onClose, onFulfill }: { bounty: Bounty; onClose: () => void; onFulfill: () => void }) {
  const isActive = bounty.status === "ACTIVE";
  const timeLeft = bounty.expires_at ? new Date(bounty.expires_at).getTime() - Date.now() : 0;
  const expiresInDays = Math.max(0, Math.ceil(timeLeft / 86400000));
  const isLimitBuy = bounty.order_type === "LIMIT_BUY";
  const isLimitSell = bounty.order_type === "LIMIT_SELL";
  const orderLabel = isLimitBuy ? "LIMIT BUY" : isLimitSell ? "LIMIT SELL" : "BOUNTY";
  const spread = calculateSpread(bounty.base_market_price, bounty.trigger_price || bounty.base_market_price);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl max-w-lg w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-5 py-3 text-xs font-bold tracking-wider flex items-center justify-between ${
          isActive ? "bg-gold/10 text-gold" : "bg-xp/10 text-xp"
        }`}>
          <span>{isActive ? `🎯 ${orderLabel}` : "✅ QUEST COMPLETE"}</span>
          <span className="text-[11px]">{bounty.platform} · {orderLabel}</span>
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
            {!isLimitBuy && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scarcity Multiplier</span>
                <span className="text-gold font-mono font-bold">×{bounty.scarcity_mult.toFixed(2)}</span>
              </div>
            )}
            {isLimitBuy && bounty.trigger_price && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trigger Price (Limit)</span>
                <span className="text-primary font-mono font-bold">${bounty.trigger_price.toFixed(2)}</span>
              </div>
            )}
            {(isLimitBuy || isLimitSell) && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Projected Spread</span>
                <span className={`font-mono ${spread.profitable ? "text-xp" : "text-destructive"}`}>
                  {spread.spreadPct.toFixed(1)}% · ${spread.margin.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t border-border/50 pt-2 flex justify-between text-base font-bold">
              <span className="text-gold text-glow-gold">Store Credit Reward</span>
              <span className="text-gold text-glow-gold font-mono">${bounty.store_credit_value.toFixed(2)}</span>
            </div>
          </div>

          {/* Fulfillment Pipeline */}
          <PipelineStepper bounty={bounty} />

          {/* Status Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-background/30 rounded p-2.5">
              <p className="text-muted-foreground">Status</p>
              <p className={`font-bold mt-0.5 ${isActive ? "text-primary" : "text-xp"}`}>
                {bounty.status}
              </p>
            </div>
            <div className="bg-background/30 rounded p-2.5">
              <p className="text-muted-foreground">Fulfillment</p>
              <p className="font-bold mt-0.5 text-foreground">{bounty.fulfillment_status || "OPEN"}</p>
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
            {isActive && bounty.status !== "CANCELLED" && (
              <button onClick={onFulfill} className="flex-1 py-2.5 text-xs rounded bg-xp text-black font-bold hover:bg-xp/90 transition-colors">
                ✅ CLAIM & FULFILL
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
// FULFILLMENT WORKFLOW MODAL (enhanced with pipeline awareness)
// ============================================================
function FulfillmentModal({ bounty, onClose }: { bounty: Bounty; onClose: () => void }) {
  const claimBounty = useGuildStore((s) => s.claimBounty);
  const [playerTag, setPlayerTag] = useState("");
  const [profileId, setProfileId] = useState("");
  const [awardXp, setAwardXp] = useState(true);
  const [fulfilling, setFulfilling] = useState(false);
  const [done, setDone] = useState(false);

  const handleFulfill = () => {
    if (!playerTag.trim() || !profileId.trim()) return;
    setFulfilling(true);
    setTimeout(() => {
      claimBounty(bounty.id, profileId.trim(), playerTag.trim());
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
          <h2 className="text-lg font-bold text-xp text-glow-green mb-2">BOUNTY CLAIMED!</h2>
          <p className="text-sm text-muted-foreground mb-2">
            {bounty.target_item_name} claimed by <span className="text-primary font-bold">{playerTag}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-4">Status set to: CLAIMED</p>
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
        <h2 className="text-sm font-bold text-xp mb-1">✅ Claim & Fulfill Bounty</h2>
        <p className="text-xs text-muted-foreground mb-4">{bounty.target_item_name}</p>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Player / Hunter Tag</label>
            <input
              type="text"
              value={playerTag}
              onChange={(e) => setPlayerTag(e.target.value)}
              placeholder="e.g. NEO_GEO"
              className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
              id="input-fulfill-player"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Profile ID (for bounty stats)</label>
            <input
              type="text"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              placeholder="e.g. usr-001"
              className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
              id="input-fulfill-profile"
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
            <p className="text-[10px] text-muted-foreground mt-1">Status will advance to CLAIMED. Use detail view to track pipeline.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              onClick={handleFulfill}
              disabled={!playerTag.trim() || !profileId.trim() || fulfilling}
              className="flex-1 py-2.5 text-xs rounded bg-xp text-black font-bold hover:bg-xp/90 transition-colors disabled:opacity-50"
            >
              {fulfilling ? "Processing..." : "✅ CONFIRM CLAIM"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BOUNTY CREATION WIZARD (enhanced with PriceCharting + Order Type)
// ============================================================
function CreateBountyWizard({ onClose }: { onClose: () => void }) {
  const addBounty = useGuildStore((s) => s.addBounty);
  const inventory = useGuildStore((s) => s.inventory);
  const addLimitOrder = useGuildStore((s) => s.addLimitOrder);

  const [step, setStep] = useState(1);
  const [itemName, setItemName] = useState("");
  const [platform, setPlatform] = useState("");
  const [searchResults, setSearchResults] = useState<typeof inventory>([]);
  const [basePrice, setBasePrice] = useState(100);
  const [multiplier, setMultiplier] = useState(1.5);
  const [triggerPrice, setTriggerPrice] = useState(75);
  const [orderType, setOrderType] = useState<OrderType>("BOUNTY");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [suggestedSpread, setSuggestedSpread] = useState<SpreadResult | null>(null);

  // Auto-suggest from inventory
  useEffect(() => {
    if (itemName.length < 2) { setSearchResults([]); return; }
    const q = itemName.toLowerCase();
    const results = inventory.filter((i) => i.item_name.toLowerCase().includes(q) || i.platform?.toLowerCase().includes(q));
    setSearchResults(results.slice(0, 5));
  }, [itemName, inventory]);

  // Wire fetchMarketPrice() — auto-populate from PriceCharting API when item name stabilizes
  useEffect(() => {
    if (!itemName.trim() || itemName.trim().length < 3) return;

    const key = itemName.trim().toLowerCase();
    const match = inventory.find((i) => i.item_name.toLowerCase() === key);

    if (match) {
      setBasePrice(match.market_value);
      if (match.platform) setPlatform(match.platform);
      const spread = calculateSpread(match.market_value, match.market_value * 0.6);
      setSuggestedSpread(spread);
      setPriceLoading(false);
      return;
    }

    // Debounced fetch from PriceCharting API
    let cancelled = false;
    setPriceLoading(true);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ item: itemName.trim() });
        if (platform.trim()) params.set("platform", platform.trim());

        const res = await fetch(`/api/bounties/price-suggest?${params.toString()}`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);

        const json = await res.json();
        if (cancelled || !json.data) return;

        const suggestion = json.data;
        setBasePrice(suggestion.marketPrice ?? suggestion.marketPrice ?? 100);
        if (suggestion.suggestedBuyPrice) setTriggerPrice(suggestion.suggestedBuyPrice);
        if (suggestion.spread) setSuggestedSpread(suggestion.spread);
      } catch {
        // API fallback: try inventory match with 60% heuristic
        if (!cancelled && inventory.length > 0) {
          const fallback = inventory.find((i) =>
            i.item_name.toLowerCase().includes(itemName.trim().toLowerCase())
          );
          if (fallback) {
            setBasePrice(fallback.market_value);
            if (fallback.platform) setPlatform(fallback.platform);
            setSuggestedSpread(
              calculateSpread(fallback.market_value, fallback.market_value * 0.6)
            );
          }
        }
      } finally {
        if (!cancelled) setPriceLoading(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemName, inventory, platform]);

  const storeCreditValue = orderType === "BOUNTY"
    ? basePrice * multiplier
    : triggerPrice;

  const spread = calculateSpread(basePrice, triggerPrice);

  const reset = () => { setStep(1); setItemName(""); setPlatform(""); setBasePrice(100); setMultiplier(1.5); setTriggerPrice(75); setOrderType("BOUNTY"); setDescription(""); setSuggestedSpread(null); };

  const handleCreate = () => {
    if (!itemName.trim()) return;
    setIsCreating(true);
    setTimeout(() => {
      const bounty: Bounty = {
        id: `bnt-${Date.now()}`,
        organization_id: "demo-time-warp-001",
        target_item_name: itemName.trim(),
        platform: platform || undefined,
        base_market_price: basePrice,
        scarcity_mult: orderType === "BOUNTY" ? multiplier : 1.0,
        store_credit_value: storeCreditValue,
        status: "ACTIVE",
        order_type: orderType,
        trigger_price: orderType !== "BOUNTY" ? triggerPrice : undefined,
        fulfillment_status: "OPEN",
        description: description || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (orderType === "LIMIT_BUY" || orderType === "LIMIT_SELL") {
        addLimitOrder(bounty);
      } else {
        addBounty(bounty);
      }

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
          <p className="text-xs text-muted-foreground">
            {orderType === "BOUNTY" ? "Bounty" : orderType === "LIMIT_BUY" ? "Limit Buy" : "Limit Sell"} posted for {itemName}
          </p>
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
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        {/* Step Indicator — 4 steps now */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{s}</div>
              {s < 4 && <div className={`h-0.5 w-8 ${step > s ? "bg-primary" : "bg-muted"}`} />}
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
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">PriceCharting market price</p>
                  {priceLoading && <span className="text-[10px] text-muted-foreground animate-pulse">Loading...</span>}
                </div>
                <p className="text-sm text-gold font-bold font-mono mt-0.5">${basePrice.toFixed(2)}</p>
                {suggestedSpread && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Suggested buy at 60%: ${(basePrice * 0.6).toFixed(2)} · {suggestedSpread.spreadPct.toFixed(1)}% spread
                  </p>
                )}
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={!itemName.trim()}
              className="w-full py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              NEXT: ORDER TYPE →
            </button>
          </div>
        )}

        {/* Step 2: Order Type (NEW) */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary">Step 2: Choose Order Type</h3>
            <div className="space-y-3">
              {([
                { value: "BOUNTY" as OrderType, icon: "🎯", label: "Bounty", desc: "Post a reward quest. Hunters bring in the item, you pay store credit." },
                { value: "LIMIT_BUY" as OrderType, icon: "📈", label: "Limit Buy", desc: "Set a max price you're willing to pay. Auto-fulfills when market dips." },
                { value: "LIMIT_SELL" as OrderType, icon: "📉", label: "Limit Sell", desc: "Set a minimum sell price. Sells when market reaches your target." },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setOrderType(opt.value); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    orderType === opt.value
                      ? "bg-primary/10 border-primary/40 text-foreground"
                      : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </div>
                    {orderType === opt.value && <span className="ml-auto text-primary text-xs">✓</span>}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">← BACK</button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">NEXT: PRICING →</button>
            </div>
          </div>
        )}

        {/* Step 3: Set Price (now conditional on order type) */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-primary">Step 3: Set Pricing Parameters</h3>

            {orderType === "BOUNTY" && (
              <>
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
              </>
            )}

            {(orderType === "LIMIT_BUY" || orderType === "LIMIT_SELL") && (
              <>
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Current Market Price ($)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="number" value={basePrice} onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)} className="flex-1 px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground" />
                    <button onClick={() => setTriggerPrice(Math.round(basePrice * 0.6))} className="px-2 py-2.5 text-[10px] rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
                      60% Auto
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {orderType === "LIMIT_BUY" ? "Trigger Price (Max Buy)" : "Trigger Price (Min Sell)"} ($)
                  </label>
                  <input
                    type="number"
                    value={triggerPrice}
                    onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground"
                    placeholder={orderType === "LIMIT_BUY" ? "e.g. 75.00" : "e.g. 120.00"}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {orderType === "LIMIT_BUY"
                      ? "Auto-fulfills when market price drops to or below this value"
                      : "Auto-sells when market price reaches or exceeds this value"}
                  </p>
                </div>

                {/* Spread Analysis */}
                <div className="bg-background/50 border border-border/50 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Spread Analysis</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Market Price</span>
                    <span className="text-foreground font-mono">${basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{orderType === "LIMIT_BUY" ? "Buy Price" : "Sell Price"}</span>
                    <span className="text-foreground font-mono">${triggerPrice.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border/30 pt-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Spread</span>
                    <span className={`font-mono font-bold ${spread.profitable ? "text-xp" : "text-destructive"}`}>
                      {spread.spreadPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Projected Margin</span>
                    <span className={`font-mono ${spread.margin > 0 ? "text-xp" : "text-destructive"}`}>
                      ${spread.margin.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">← BACK</button>
              <button onClick={() => setStep(4)} className="flex-1 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">NEXT: CONFIRM →</button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gold">Step 4: Confirm Deployment</h3>
            <div className="bg-background/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Item</span><span className="text-foreground font-bold">{itemName}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Platform</span><span className="text-foreground">{platform || "Any"}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Order Type</span><span className="text-foreground font-bold">{orderType === "BOUNTY" ? "🎯 Bounty" : orderType === "LIMIT_BUY" ? "📈 Limit Buy" : "📉 Limit Sell"}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Base Price</span><span className="text-foreground font-mono">${basePrice.toFixed(2)}</span></div>
              {orderType === "BOUNTY" && (
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Multiplier</span><span className="text-gold font-mono">×{multiplier.toFixed(2)}</span></div>
              )}
              {(orderType === "LIMIT_BUY" || orderType === "LIMIT_SELL") && (
                <>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Trigger Price</span><span className="text-primary font-mono">${triggerPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Projected Spread</span><span className={`font-mono ${spread.profitable ? "text-xp" : "text-destructive"}`}>{spread.spreadPct.toFixed(1)}%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Projected Margin</span><span className={`font-mono ${spread.margin > 0 ? "text-xp" : "text-destructive"}`}>${spread.margin.toFixed(2)}</span></div>
                </>
              )}
              <div className="border-t border-border/50 pt-2 flex justify-between text-sm font-bold">
                <span className="text-gold text-glow-gold">
                  {orderType === "BOUNTY" ? "Final Reward" : "Store Credit Value"}
                </span>
                <span className="text-gold text-glow-gold font-mono">${storeCreditValue.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Description (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Why is this item wanted?" className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">← BACK</button>
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
// BOUNTY CARD (enhanced with order type display)
// ============================================================
function BountyCard({ bounty, onClick }: { bounty: Bounty; onClick: () => void }) {
  const isFulfilled = bounty.status === "FULFILLED";
  const isExpired = bounty.status === "EXPIRED";
  const isCancelled = bounty.status === "CANCELLED";
  const isActive = bounty.status === "ACTIVE";
  const isLimitBuy = bounty.order_type === "LIMIT_BUY";
  const isLimitSell = bounty.order_type === "LIMIT_SELL";

  const expiresAt = bounty.expires_at ? new Date(bounty.expires_at).getTime() : null;
  const timeLeft = expiresAt ? expiresAt - Date.now() : 0;
  const expiresInDays = Math.max(0, Math.ceil(timeLeft / 86400000));
  const isExpiringSoon = isActive && expiresInDays <= 7;

  const orderIcon = isLimitBuy ? "📈" : isLimitSell ? "📉" : "🎯";
  const orderLabel = isLimitBuy ? "LIMIT BUY" : isLimitSell ? "LIMIT SELL" : "BOUNTY";

  return (
    <div
      onClick={onClick}
      className={`guild-card bg-card rounded-lg overflow-hidden cursor-pointer ${
        isFulfilled ? "opacity-70 border-xp/20" :
        isExpired || isCancelled ? "opacity-50 border-muted/20" :
        "border-gold/20"
      }`}
    >
      <div className={`px-4 py-2 text-xs font-bold tracking-wider flex items-center justify-between ${
        isFulfilled ? "bg-xp/10 text-xp" :
        isExpired || isCancelled ? "bg-muted/10 text-muted-foreground" :
        isLimitBuy ? "bg-blue-900/20 text-blue-400" :
        isLimitSell ? "bg-purple-900/20 text-purple-400" :
        "bg-gold/10 text-gold"
      }`}>
        <span>{isFulfilled ? "✅ QUEST COMPLETE" : isExpired ? "⌛ EXPIRED" : isCancelled ? "🚫 CANCELLED" : `${orderIcon} ${orderLabel}`}</span>
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
            <span className="text-muted-foreground">Market Price</span>
            <span className="text-foreground font-mono">${bounty.base_market_price.toFixed(2)}</span>
          </div>
          {isLimitBuy && bounty.trigger_price && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Limit Price</span>
              <span className="text-primary font-mono">≤ ${bounty.trigger_price.toFixed(2)}</span>
            </div>
          )}
          {!isLimitBuy && !isLimitSell && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Scarcity</span>
              <span className="text-gold font-mono">×{bounty.scarcity_mult.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-border/50 pt-1 flex justify-between text-sm font-bold">
            <span className="text-gold">Store Credit</span>
            <span className="text-gold text-glow-gold font-mono">${bounty.store_credit_value.toFixed(2)}</span>
          </div>
        </div>

        {/* Fulfillment Status Badge */}
        {bounty.fulfillment_status && bounty.fulfillment_status !== "OPEN" && (
          <p className="text-[10px] text-muted-foreground">
            Pipeline: {bounty.fulfillment_status}
          </p>
        )}

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
// ORDER BOOK VIEW (Limit Orders tab)
// ============================================================
function OrderBookView({ limitOrders }: { limitOrders: Bounty[] }) {
  if (limitOrders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg mb-1">📊</p>
        <p>No limit orders yet. Create a Limit Buy or Limit Sell to see them here.</p>
      </div>
    );
  }

  const buys = limitOrders.filter((o) => o.order_type === "LIMIT_BUY").sort((a, b) => (b.trigger_price || 0) - (a.trigger_price || 0));
  const sells = limitOrders.filter((o) => o.order_type === "LIMIT_SELL").sort((a, b) => (a.trigger_price || 0) - (b.trigger_price || 0));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Buy Side */}
      <div className="guild-card bg-card border border-blue-900/30 rounded-lg overflow-hidden">
        <div className="bg-blue-900/20 px-4 py-2 border-b border-blue-900/30">
          <h3 className="text-xs font-bold text-blue-400">📈 Limit Buys</h3>
          <p className="text-[10px] text-muted-foreground">Want to buy at or below trigger</p>
        </div>
        <div className="divide-y divide-border/30">
          {buys.map((order) => {
            const spread = calculateSpread(order.base_market_price, order.trigger_price || 0);
            return (
              <div key={order.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{order.target_item_name}</p>
                  <p className="text-[10px] text-muted-foreground">{order.platform || "Any"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-400 font-mono">≤ ${(order.trigger_price || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Market: ${order.base_market_price.toFixed(2)}</p>
                  <p className={`text-[10px] font-mono ${spread.profitable ? "text-xp" : "text-destructive"}`}>
                    {spread.spreadPct.toFixed(1)}% spread
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sell Side */}
      <div className="guild-card bg-card border border-purple-900/30 rounded-lg overflow-hidden">
        <div className="bg-purple-900/20 px-4 py-2 border-b border-purple-900/30">
          <h3 className="text-xs font-bold text-purple-400">📉 Limit Sells</h3>
          <p className="text-[10px] text-muted-foreground">Want to sell at or above trigger</p>
        </div>
        <div className="divide-y divide-border/30">
          {sells.map((order) => {
            const spread = calculateSpread(order.trigger_price || 0, order.base_market_price);
            return (
              <div key={order.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{order.target_item_name}</p>
                  <p className="text-[10px] text-muted-foreground">{order.platform || "Any"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-purple-400 font-mono">≥ ${(order.trigger_price || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Market: ${order.base_market_price.toFixed(2)}</p>
                  <p className={`text-[10px] font-mono ${spread.profitable ? "text-xp" : "text-destructive"}`}>
                    {spread.spreadPct.toFixed(1)}% spread
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN BOUNTY BOARD PAGE
// ============================================================
export default function BountyBoardPage() {
  const bounties = useGuildStore((s) => s.bounties);
  const arbitrageMatches = useGuildStore((s) => s.arbitrageMatches);
  const [showForm, setShowForm] = useState(false);
  const [showFulfill, setShowFulfill] = useState<string | null>(null);
  const [detailBounty, setDetailBounty] = useState<Bounty | null>(null);
  const [sortBy, setSortBy] = useState<"reward" | "newest" | "expiring">("newest");
  const [activeTab, setActiveTab] = useState<string>("ACTIVE");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const activeBounties = bounties.filter((b) => b.status === "ACTIVE" && (!b.order_type || b.order_type === "BOUNTY"));
  const limitOrders = bounties.filter((b) => b.status === "ACTIVE" && (b.order_type === "LIMIT_BUY" || b.order_type === "LIMIT_SELL"));
  const fulfilledBounties = bounties.filter((b) => b.status === "FULFILLED");
  const expiredBounties = bounties.filter((b) => b.status === "EXPIRED" || b.status === "CANCELLED");

  const displayBounties = useMemo(() => {
    let items: Bounty[];
    switch (activeTab) {
      case "FULFILLED": items = [...fulfilledBounties]; break;
      case "EXPIRED": items = [...expiredBounties]; break;
      case "LIMIT_ORDERS": items = []; break; // Rendered by OrderBookView
      default: items = [...activeBounties]; break;
    }

    // If limit orders tab, skip sorting (renders differently)
    if (activeTab === "LIMIT_ORDERS") return items;

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

  // Arbitrage alerts
  const hasArbitrageAlerts = arbitrageMatches.some((m) => m.status === "ACTIVE" && m.spread_pct > 15);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="flex gap-1 border-b border-border pb-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-7 w-24 bg-muted rounded animate-pulse" />)}
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
            {activeBounties.length} active · {limitOrders.length} limit orders · {fulfilledBounties.length} fulfilled
            {hasArbitrageAlerts && <span className="text-gold ml-2">⚡ Arbitrage opportunities detected!</span>}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          id="btn-post-bounty"
        >
          {showForm ? "✕ Cancel" : "📌 POST BOUNTY / LIMIT"}
        </button>
      </div>

      {/* Tabs (extended with Limit Orders) */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {[
          { key: "ACTIVE", label: "Active", count: activeBounties.length },
          { key: "LIMIT_ORDERS", label: "📊 Limit Orders", count: limitOrders.length },
          { key: "FULFILLED", label: "Fulfilled", count: fulfilledBounties.length },
          { key: "EXPIRED", label: "Expired", count: expiredBounties.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Sort Controls (hidden for limit orders tab) */}
      {activeTab !== "LIMIT_ORDERS" && (
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
      )}

      {/* Create Bounty Wizard */}
      {showForm && <CreateBountyWizard onClose={() => setShowForm(false)} />}

      {/* Limit Orders Tab */}
      {activeTab === "LIMIT_ORDERS" && (
        <OrderBookView limitOrders={limitOrders} />
      )}

      {/* Empty States */}
      {activeTab === "ACTIVE" && displayBounties.length === 0 && (
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

      {activeTab === "EXPIRED" && displayBounties.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">⌛</p>
          <p>No expired bounties.</p>
        </div>
      )}

      {activeTab === "FULFILLED" && displayBounties.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-1">✅</p>
          <p>No fulfilled bounties yet. The first one&apos;s always special.</p>
        </div>
      )}

      {/* Bounty Grid (not shown for limit orders tab) */}
      {activeTab !== "LIMIT_ORDERS" && displayBounties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayBounties.map((bounty) => (
            <div key={bounty.id} className="relative">
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
                const addBounty = useGuildStore.getState().addBounty;
                addBounty({
                  ...bounty,
                  id: `bnt-${Date.now()}`,
                  status: "ACTIVE",
                  fulfillment_status: "OPEN",
                  fulfilled_by: undefined,
                  fulfilled_at: undefined,
                  claimed_by: undefined,
                  claimed_at: undefined,
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
