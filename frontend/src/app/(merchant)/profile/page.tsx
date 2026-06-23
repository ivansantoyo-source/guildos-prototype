"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useGuildStore } from "@/lib/store/useGuildStore";
import { toast } from "@/components/ui/toaster";
import { emailSchema, phoneSchema } from "@/lib/validation/schemas";
import type { Profile, Faction, VitalityQuest } from "@/lib/types";

// Lazy load CharacterSheet — heavy component with multiple sub-components
const CharacterSheet = dynamic(() => import("@/components/vitality/character-sheet"), {
  loading: () => <CharacterSheetSkeleton />,
  ssr: false,
});

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
// CHARACTER SHEET SKELETON (shown while dynamic import loads)
// ============================================================
function CharacterSheetSkeleton() {
  return (
    <div className="guild-card bg-card rounded-lg p-6 border-border/20 animate-pulse space-y-4">
      <div className="h-20 w-20 rounded-full bg-muted mx-auto" />
      <div className="h-4 w-24 bg-muted rounded mx-auto" />
      <div className="h-3 w-32 bg-muted rounded mx-auto" />
      <div className="space-y-2 mt-4">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
        <div className="h-3 w-1/2 bg-muted rounded" />
      </div>
    </div>
  );
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
  const stamina = useGuildStore((s) => s.stamina);
  const maxStamina = useGuildStore((s) => s.maxStamina);
  const debuffType = useGuildStore((s) => s.debuffType);
  const debuffUntil = useGuildStore((s) => s.debuffUntil);
  const setStaminaVal = useGuildStore((s) => s.setStamina);
  const clearDebuffAction = useGuildStore((s) => s.clearDebuff);

  const handleClearDebuff = () => {
    clearDebuffAction();
  };

  // Build character sheet profile from store state
  const characterProfile = {
    id: user.id,
    display_name: user.display_name,
    level_tier: user.level_tier,
    xp_points: user.xp_points,
    faction: user.faction,
    total_spend: user.total_spend,
    mind_stat: 12,
    body_stat: 8,
    soul_stat: 15,
    stamina,
    maxStamina,
    debuffType,
    debuffUntil,
    purchase_tags: user.purchase_tags ?? [],
    hydration_count: 3,
    stretch_count: 1,
  };

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.display_name);
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; phone?: string; displayName?: string }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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

  // Track unsaved changes by comparing form state to the store
  useEffect(() => {
    const changed = displayName !== user.display_name || email !== (user.email || "") || phone !== (user.phone || "");
    setHasUnsavedChanges(changed);
  }, [displayName, email, phone, user.display_name, user.email, user.phone]);

  const tier = getTier(user.xp_points);
  const contribution = factionStandings.find((fs) => fs.faction === user.faction);
  const userFactionName = user.faction
    ? user.faction === "SEGA_SYNDICATE" ? "Sega Syndicate"
      : user.faction === "NINTENDO_NOMADS" ? "Nintendo Nomads"
      : "Sony Sentinels"
    : "None";

  // Validation helpers using existing Zod schemas
  const validateForm = useCallback(() => {
    const nameErr = !displayName || displayName.trim().length < 2
      ? "Display name must be at least 2 characters"
      : displayName.length > 50
        ? "Display name must be 50 characters or less"
        : null;

    let emailErr: string | null = null;
    if (email) {
      const result = emailSchema.safeParse(email);
      if (!result.success) emailErr = "Please enter a valid email address";
    }

    let phoneErr: string | null = null;
    if (phone) {
      const result = phoneSchema.safeParse(phone);
      if (!result.success) phoneErr = "Please enter a valid phone number (e.g. +1-555-0123)";
    }

    setErrors({
      displayName: nameErr ?? undefined,
      email: emailErr ?? undefined,
      phone: phoneErr ?? undefined,
    });

    return !nameErr && !emailErr && !phoneErr;
  }, [displayName, email, phone]);

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setErrors({});

    try {
      // Optimistically update the Zustand store for immediate UI feedback
      const currentUser = useGuildStore.getState().user;
      if (currentUser) {
        useGuildStore.getState().setUser({
          ...currentUser,
          display_name: displayName,
          email,
          phone,
          updated_at: new Date().toISOString(),
        });
      }

      // Persist to the tenant settings API (handles store-level fields: email, phone)
      const params = new URLSearchParams(window.location.search).toString();
      const url = `/api/tenant/settings${params ? '?' + params : ''}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: { email, phone },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.warn('[Profile] Tenant settings sync failed:', body.error || res.statusText);
        toast('warning', 'Partially saved', 'Profile updated locally, but server sync failed. Changes may not persist after refresh.');
      } else {
        toast('success', 'Profile updated', 'Your profile changes have been saved.');
      }

      setSaving(false);
      setSaved(true);
      setEditing(false);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaving(false);
      console.error('[Profile] Save error:', err);
      toast('error', 'Save failed', 'Could not save profile changes. Please try again.');
    }
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
        {/* ============ LEFT COLUMN: CHARACTER SHEET ============ */}
        <div className="lg:col-span-1 space-y-4">
          <CharacterSheet
            profile={characterProfile}
            onClearDebuff={handleClearDebuff}
          />

          {/* Vitality Quests */}
          <VitalityQuestsSection />
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
                {/* Unsaved changes indicator */}
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-amber-400/10 border border-amber-400/30">
                    <span className="text-[9px] text-amber-400 font-bold">UNSAVED CHANGES</span>
                  </div>
                )}
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Display Name</label>
                  <input type="text" value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value); setErrors((prev) => ({ ...prev, displayName: undefined })); }}
                    className={`mt-1 w-full px-3 py-2 text-sm bg-background border rounded guild-input text-foreground ${errors.displayName ? 'border-destructive' : 'border-border'}`} />
                  {errors.displayName && <p className="text-[10px] text-destructive mt-1">{errors.displayName}</p>}
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Email</label>
                  <input type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
                    className={`mt-1 w-full px-3 py-2 text-sm bg-background border rounded guild-input text-foreground ${errors.email ? 'border-destructive' : 'border-border'}`}
                    placeholder="you@example.com" />
                  {errors.email ? (
                    <p className="text-[10px] text-destructive mt-1">{errors.email}</p>
                  ) : (
                    email && <p className="text-[10px] text-muted-foreground mt-0.5">Valid email format</p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Phone</label>
                  <input type="tel" value={phone}
                    onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: undefined })); }}
                    className={`mt-1 w-full px-3 py-2 text-sm bg-background border rounded guild-input text-foreground ${errors.phone ? 'border-destructive' : 'border-border'}`}
                    placeholder="+1-555-0123" />
                  {errors.phone ? (
                    <p className="text-[10px] text-destructive mt-1">{errors.phone}</p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-0.5">Format: +1-555-0123</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setDisplayName(user.display_name); setEmail(user.email || ""); setPhone(user.phone || ""); setErrors({}); }}
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
                    role="switch"
                    aria-checked={notifSettings[key]}
                    aria-label={`${label} notification`}
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

// ============================================================
// VITALITY QUESTS SECTION
// ============================================================
const QUEST_TYPE_ICONS: Record<string, string> = {
  STRETCH: "🤸",
  HYDRATION: "💧",
  STEPS: "👣",
  POSTURE_CHECK: "🧍",
  EYE_REST: "👁️",
  SOCIAL: "🗣️",
  MINDFULNESS: "🧘",
};

function VitalityQuestsSection() {
  const vitalityQuests = useGuildStore((s) => s.vitalityQuests);
  const vitalityCompletions = useGuildStore((s) => s.vitalityCompletions);
  const addVitalityCompletion = useGuildStore((s) => s.addVitalityCompletion);
  const addXP = useGuildStore((s) => s.addXP);
  const updateStaminaValue = useGuildStore((s) => s.setStamina);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Filter available quests (only active ones)
  const availableQuests = vitalityQuests.filter((q) => q.is_active);

  // Handle QR scan
  const handleScanQr = () => {
    setQrScannerOpen(true);
  };

  const handleCompleteQuest = useCallback(
    (quest: VitalityQuest) => {
      if (completingId) return; // Already completing one
      setCompletingId(quest.id);

      // Simulate completion delay
      setTimeout(() => {
        const now = new Date().toISOString();
        addVitalityCompletion({
          id: `vc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          profile_id: "usr-001",
          quest_id: quest.id,
          completed_at: now,
          xp_earned: quest.xp_reward,
          stamina_restored: quest.stamina_restore,
        });
        addXP(quest.xp_reward, "VITALITY_QUEST");
        // Restore stamina
        const currentStamina = useGuildStore.getState().stamina;
        updateStaminaValue(
          Math.min(useGuildStore.getState().maxStamina, currentStamina + quest.stamina_restore)
        );
        setCompletingId(null);

        toast(
          "success",
          `Quest Complete: ${quest.name}`,
          `${quest.xp_reward} XP earned · ${quest.stamina_restore} stamina restored`
        );
      }, 1200);
    },
    [completingId, addVitalityCompletion, addXP, updateStaminaValue]
  );

  // Group recently completed quest IDs
  const recentCompletions = vitalityCompletions
    .filter((c) => {
      const age = Date.now() - new Date(c.completed_at).getTime();
      return age < 1000 * 60 * 10; // completed in last 10 minutes
    })
    .map((c) => c.quest_id);
  const recentCompletedSet = new Set(recentCompletions);

  return (
    <div className="guild-card bg-card rounded-lg p-4 border-primary/20 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <span>💪</span>
          Vitality Quests
        </h3>
        <button
          onClick={handleScanQr}
          className="px-2.5 py-1 text-[10px] rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
        >
          📷 Scan QR
        </button>
      </div>

      {/* Available Quests */}
      <div className="space-y-2">
        {availableQuests.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">No vitality quests available.</p>
          </div>
        )}
        {availableQuests.map((quest) => {
          const icon = QUEST_TYPE_ICONS[quest.quest_type] ?? "⭐";
          const justCompleted = recentCompletedSet.has(quest.id);
          const isCompleting = completingId === quest.id;

          return (
            <div
              key={quest.id}
              className={`rounded-lg p-3 border transition-all ${
                justCompleted
                  ? "bg-xp/10 border-xp/30"
                  : "bg-background/30 border-border/30 hover:border-primary/20"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{quest.name}</p>
                    {justCompleted && (
                      <span className="text-[10px] text-xp font-bold">✅ Done</span>
                    )}
                  </div>
                  {quest.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                      {quest.description}
                    </p>
                  )}
                  {/* Rewards row */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-xp font-mono font-bold">
                      +{quest.xp_reward} XP
                    </span>
                    <span className="text-[10px] text-primary font-mono">
                      +{quest.stamina_restore} stamina
                    </span>
                    <span className="text-[9px] text-muted-foreground ml-auto">
                      cooldown {quest.cooldown_minutes}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Complete button */}
              {!justCompleted && (
                <button
                  onClick={() => handleCompleteQuest(quest)}
                  disabled={isCompleting}
                  className="mt-2 w-full py-1.5 text-[10px] rounded bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isCompleting ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      COMPLETING...
                    </>
                  ) : (
                    "✅ COMPLETE"
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* QR Scanner Modal */}
      {qrScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setQrScannerOpen(false)} />
          <div className="relative bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200 text-center">
            <span className="text-5xl block mb-4">📷</span>
            <h3 className="text-sm font-bold text-primary mb-2">Scan Vitality QR</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Point your camera at a vitality station QR code to scan and complete a quest.
            </p>
            <div className="bg-background/50 rounded-lg p-4 border border-dashed border-border mb-4">
              <div className="w-32 h-32 mx-auto rounded-lg bg-muted flex items-center justify-center">
                <span className="text-3xl">📸</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setQrScannerOpen(false)}
                className="flex-1 py-2.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setQrScannerOpen(false);
                  // Simulate scanning — complete the first available quest
                  if (availableQuests.length > 0) {
                    handleCompleteQuest(availableQuests[0]);
                  }
                }}
                className="flex-1 py-2.5 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
              >
                Simulate Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
