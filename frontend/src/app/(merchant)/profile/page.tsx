"use client";

import React, { useState, useEffect } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { Profile, Faction } from "@/lib/types";

// ============================================================
// ACHIEVEMENT BADGES (phantom data)
// ============================================================
const ACHIEVEMENTS = [
  { id: "ach-001", name: "First Scan", description: "Scanned your first inventory item", icon: "📸", earned: true, date: "2026-06-01" },
  { id: "ach-002", name: "Bounty Hunter", description: "Fulfilled 5 bounties", icon: "📜", earned: true, date: "2026-06-10" },
  { id: "ach-003", name: "Gold Hoarder", description: "Accumulated $5,000 in revenue", icon: "🪙", earned: true, date: "2026-06-15" },
  { id: "ach-004", name: "Faction Champion", description: "Your faction won the monthly war", icon: "⚔️", earned: false },
  { id: "ach-005", name: "Legendary Collector", description: "Acquire 10 legendary items", icon: "💎", earned: false },
  { id: "ach-006", name: "Social Butterfly", description: "Create 10 LFG lobbies", icon: "🎮", earned: false },
  { id: "ach-007", name: "High Score", description: "Top the leaderboard on any cabinet", icon: "🏆", earned: true, date: "2026-06-20" },
  { id: "ach-008", name: "Konami Seeker", description: "Activate the Konami Code", icon: "🕹️", earned: true, date: "2026-06-18" },
];

// ============================================================
// PURCHASE HISTORY (phantom data)
// ============================================================
const PURCHASE_HISTORY = [
  { id: "ph-001", item: "Chrono Trigger (SNES)", amount: 199.99, date: "2026-06-15", type: "SALE" },
  { id: "ph-002", item: "EarthBound (SNES)", amount: 379.99, date: "2026-06-12", type: "SALE" },
  { id: "ph-003", item: "Panzer Dragoon Saga (SATURN)", amount: 899.99, date: "2026-06-08", type: "GRAIL" },
  { id: "ph-004", item: "Super Mario RPG (SNES)", amount: 89.99, date: "2026-06-05", type: "SALE" },
  { id: "ph-005", item: "Save Room Beta - June", amount: 35.00, date: "2026-06-01", type: "SUBSCRIPTION" },
];

// ============================================================
// LEVEL TIER CONFIG
// ============================================================
const TIER_CONFIG: Record<string, { min: number; icon: string; color: string; label: string }> = {
  PEASANT: { min: 0, icon: "🌱", color: "text-muted-foreground", label: "Peasant" },
  RETRO_MAGE: { min: 10000, icon: "🧙", color: "text-primary", label: "Retro Mage" },
  TIME_LORD: { min: 25000, icon: "👑", color: "text-gold text-glow-gold", label: "Time Lord" },
};

function getTier(xp: number) {
  if (xp >= 25000) return { ...TIER_CONFIG.TIME_LORD, key: "TIME_LORD" };
  if (xp >= 10000) return { ...TIER_CONFIG.RETRO_MAGE, key: "RETRO_MAGE" };
  return { ...TIER_CONFIG.PEASANT, key: "PEASANT" };
}

// ============================================================
// MAIN PROFILE PAGE
// ============================================================
export default function ProfilePage() {
  // Current demo user profile
  const demoProfile: Profile = {
    id: "usr-001",
    organization_id: "demo-time-warp-001",
    display_name: "TRON_99",
    role: "owner",
    faction: "SEGA_SYNDICATE",
    xp_points: 12500,
    level_tier: "RETRO_MAGE",
    email: "tron@guildos.com",
    phone: "+1-555-0123",
    purchase_tags: ["JRPG", "SEGA", "ARCADE"],
    total_spend: 1250.00,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: new Date().toISOString(),
  };

  const user = useGuildStore((s) => s.user) || demoProfile;
  const factionStandings = useGuildStore((s) => s.factionStandings);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.display_name);
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    priceSpikes: true,
    bountyFulfilled: true,
    scoreDethroned: true,
    factionWins: true,
    marketing: false,
    lfgReminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const tier = getTier(user.xp_points);
  const contribution = factionStandings.find((fs) => fs.faction === user.faction);
  const userFactionName = user.faction
    ? user.faction === "SEGA_SYNDICATE" ? "Sega Syndicate"
      : user.faction === "NINTENDO_NOMADS" ? "Nintendo Nomads"
      : "Sony Sentinels"
    : "None";

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  const handleDeleteAccount = () => {
    const { logout } = useGuildStore.getState();
    logout();
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="guild-card bg-card rounded-lg p-6 border-border/20 animate-pulse space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted mx-auto" />
              <div className="h-4 w-24 bg-muted rounded mx-auto" />
              <div className="h-3 w-32 bg-muted rounded mx-auto" />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-card rounded-lg border-border/20 animate-pulse" />
            <div className="h-32 bg-card rounded-lg border-border/20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary text-glow-green">PHYSICAL. SAVE ROOM.</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Profile management · Achievements · Account settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============ LEFT COLUMN: PROFILE CARD ============ */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar & Basic Info */}
          <div className="guild-card bg-card rounded-lg p-6 border-primary/20 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-3xl mx-auto animate-glow-breathe">
              🎮
            </div>
            <h2 className="text-lg font-bold text-foreground mt-3">{user.display_name}</h2>
            <p className={`text-xs font-bold ${tier.color}`}>
              {tier.icon} {tier.label}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {user.xp_points.toLocaleString()} XP
            </p>

            {/* XP Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">Progress to next tier</span>
                <span className="text-xp font-bold">{Math.min(100, Math.round((user.xp_points / 25000) * 100))}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-xp transition-all duration-1000" style={{ width: `${Math.min(100, (user.xp_points / 25000) * 100)}%` }} />
              </div>
            </div>

            {/* Faction */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Faction</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{userFactionName}</p>
              {contribution && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  ${contribution.total_points.toLocaleString()} contributed this month
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-background/50 rounded p-2">
                <p className="text-[10px] text-muted-foreground">Total Spend</p>
                <p className="text-sm text-gold font-bold font-mono">${user.total_spend.toFixed(2)}</p>
              </div>
              <div className="bg-background/50 rounded p-2">
                <p className="text-[10px] text-muted-foreground">Role</p>
                <p className="text-sm text-primary font-bold capitalize">{user.role}</p>
              </div>
            </div>

            {/* Tags */}
            {user.purchase_tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1 justify-center">
                {user.purchase_tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    #{tag.toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============ RIGHT COLUMN: DETAILS ============ */}
        <div className="lg:col-span-2 space-y-6">
          {/* EDIT PROFILE FORM */}
          <div className="guild-card bg-card rounded-lg p-6 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Profile Details</h3>
              {!editing && (
                <button onClick={() => setEditing(true)} className="px-3 py-1 text-[11px] rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
                  ✏️ Edit
                </button>
              )}
            </div>

            {!editing ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Display Name</span>
                  <span className="text-foreground font-bold">{user.display_name}</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{user.email || "Not set"}</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-foreground">{user.phone || "Not set"}</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="text-foreground">{new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex justify-between text-xs py-2">
                  <span className="text-muted-foreground">Last Active</span>
                  <span className="text-foreground">{user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : "Today"}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Display Name</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded guild-input text-foreground" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setDisplayName(user.display_name); setEmail(user.email || ""); setPhone(user.phone || ""); }}
                    className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {saving ? "SAVING..." : saved ? "✅ SAVED" : "SAVE CHANGES"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PURCHASE HISTORY */}
          <div className="guild-card bg-card rounded-lg p-6 border-primary/20">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Purchase History</h3>
            <div className="space-y-2">
              {PURCHASE_HISTORY.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-xs text-foreground">{purchase.item}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(purchase.date).toLocaleDateString()} · {purchase.type}</p>
                  </div>
                  <span className="text-xs text-gold font-mono font-bold">${purchase.amount.toFixed(2)}</span>
                </div>
              ))}
              {PURCHASE_HISTORY.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No purchase history yet.</p>
              )}
            </div>
          </div>

          {/* ACHIEVEMENT BADGES */}
          <div className="guild-card bg-card rounded-lg p-6 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Achievement Badges</h3>
              <span className="text-[10px] text-muted-foreground">{ACHIEVEMENTS.filter((a) => a.earned).length}/{ACHIEVEMENTS.length} earned</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ACHIEVEMENTS.map((ach) => (
                <div
                  key={ach.id}
                  className={`rounded-lg p-3 text-center border transition-all ${
                    ach.earned
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/20 border-border opacity-50"
                  }`}
                >
                  <span className={`text-2xl ${ach.earned ? "" : "grayscale"}`}>{ach.icon}</span>
                  <p className={`text-[11px] font-bold mt-1 ${ach.earned ? "text-foreground" : "text-muted-foreground"}`}>
                    {ach.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{ach.description}</p>
                  {ach.earned && ach.date && (
                    <p className="text-[8px] text-xp mt-1">{new Date(ach.date).toLocaleDateString()}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* NOTIFICATION PREFERENCES */}
          <div className="guild-card bg-card rounded-lg p-6 border-primary/20">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Notification Preferences</h3>
            <div className="space-y-3">
              {([
                { key: "priceSpikes", label: "Price Spike Alerts" },
                { key: "bountyFulfilled", label: "Bounty Fulfilled" },
                { key: "scoreDethroned", label: "Score Dethroned" },
                { key: "factionWins", label: "Faction War Results" },
                { key: "marketing", label: "Marketing & Promotions" },
                { key: "lfgReminders", label: "LFG Session Reminders" },
              ] as const).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-foreground">{label}</span>
                  <button
                    onClick={() => setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${notifSettings[key] ? "bg-primary" : "bg-muted"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${notifSettings[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="guild-card bg-card rounded-lg p-6 border-destructive/30">
            <h3 className="text-xs font-bold text-destructive uppercase tracking-wider mb-2">Danger Zone</h3>
            <p className="text-[11px] text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-xs rounded bg-destructive/20 border border-destructive/30 text-destructive font-bold hover:bg-destructive/30 transition-colors"
            >
              🗑️ DELETE ACCOUNT
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-card border border-destructive/30 rounded-xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-destructive mb-2">⚠️ Delete Account?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              This will permanently delete <span className="text-foreground font-bold">{user.display_name}</span> and all associated data including inventory, bounties, and lobbies. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} className="flex-1 py-2.5 text-xs rounded bg-destructive text-white font-bold hover:bg-destructive/90 transition-colors">
                🗑️ DELETE FOREVER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
