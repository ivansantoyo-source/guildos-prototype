"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Faction } from "@/lib/types";

const FACTIONS: {
  id: Faction;
  name: string;
  icon: string;
  color: string;
  border: string;
  bg: string;
  desc: string;
  members: number;
}[] = [
  {
    id: "SEGA_SYNDICATE",
    name: "Sega Syndicate",
    icon: "🔵",
    color: "text-faction-sega",
    border: "border-faction-sega/40",
    bg: "bg-faction-sega/10",
    desc: "Speed, style, and the 16-bit wars",
    members: 1240,
  },
  {
    id: "NINTENDO_NOMADS",
    name: "Nintendo Nomads",
    icon: "🔴",
    color: "text-faction-nintendo",
    border: "border-faction-nintendo/40",
    bg: "bg-faction-nintendo/10",
    desc: "Quality, nostalgia, and iconic IPs",
    members: 1560,
  },
  {
    id: "SONY_SENTINELS",
    name: "Sony Sentinels",
    icon: "🟣",
    color: "text-faction-sony",
    border: "border-faction-sony/40",
    bg: "bg-faction-sony/10",
    desc: "Innovation, 3D era, and JRPGs",
    members: 980,
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  // States
  const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "error" | "redirecting">("loading");
  const [displayName, setDisplayName] = useState("");
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth state
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth + existing profile on mount
  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          // Not authenticated — redirect to login
          router.push("/login");
          return;
        }

        setUserId(session.user.id);

        // Check if profile already exists (re-visiting onboarding)
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, display_name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (existingProfile?.display_name) {
          // Already onboarded — go to dashboard
          router.push("/dashboard");
          return;
        }

        setStatus("ready");
      } catch {
        setStatus("error");
        setError("Failed to load. Please try again.");
      }
    }
    init();
  }, [router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError("Please enter a display name.");
      return;
    }
    if (!selectedFaction) {
      setError("Please choose a faction.");
      return;
    }

    setError(null);
    setStatus("submitting");

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setError("Session expired. Please sign in again.");
        setStatus("error");
        return;
      }

      // Create profile in guildos_core.profiles
      const { error: insertError } = await supabase.from("profiles").insert({
        id: session.user.id,
        organization_id: session.user.id, // Default org = own ID (matches getServerSession fallback)
        display_name: displayName.trim(),
        role: "owner",
        faction: selectedFaction,
        xp_points: 0,
        level_tier: "PEASANT",
      });

      if (insertError) {
        console.error("[onboarding] Profile insert error:", insertError);
        setError("Failed to save your profile. Please try again.");
        setStatus("error");
        return;
      }

      // Also update user metadata with faction
      await supabase.auth.updateUser({
        data: { faction: selectedFaction, display_name: displayName.trim(), role: "owner" },
      });

      setStatus("redirecting");
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (err) {
      console.error("[onboarding] Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setStatus("error");
    }
  };

  // Faction selection handler
  const handleFactionSelect = (id: Faction) => {
    setSelectedFaction(id);
  };

  // ===== LOADING =====
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ===== ERROR (fatal) =====
  if (status === "error" && !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="guild-card bg-card rounded-xl p-6 border-primary/20 max-w-md mx-4">
          <div className="text-center">
            <span className="text-5xl block mb-4">⚠️</span>
            <h2 className="text-sm font-bold text-destructive mb-2">Something Went Wrong</h2>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== REDIRECTING =====
  if (status === "redirecting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
          <p className="text-sm text-foreground font-medium">Setting up your terminal...</p>
        </div>
      </div>
    );
  }

  // ===== ONBOARDING FORM =====
  return (
    <div id="main-content" className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-legendary/5 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-legendary/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🎮</span>
            <span className="text-2xl font-bold text-primary text-glow-green tracking-wider">GUILD_OS</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">
            Welcome, merchant! Let&apos;s set up your terminal.
          </p>
        </div>

        {/* Form Card */}
        <div className="guild-card bg-card rounded-xl p-6 border-primary/20 shadow-[0_0_30px_oklch(0.78_0.2_145/5%)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label
                htmlFor="input-display-name"
                className="text-[11px] text-muted-foreground uppercase tracking-wider"
              >
                Display Name
              </label>
              <input
                id="input-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your merchant name"
                className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
                autoFocus
                autoComplete="name"
                maxLength={50}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                This is how other merchants will see you.
              </p>
            </div>

            {/* Faction Selection */}
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-2">
                Choose Your Faction
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FACTIONS.map((faction) => (
                  <button
                    key={faction.id}
                    type="button"
                    onClick={() => handleFactionSelect(faction.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedFaction === faction.id
                        ? `${faction.border} ${faction.bg} shadow-lg`
                        : "border-border bg-background hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="text-xl block">{faction.icon}</span>
                    <span className="text-[9px] text-foreground/70 block mt-1 truncate">{faction.name}</span>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">
                      {faction.members.toLocaleString()} members
                    </span>
                  </button>
                ))}
              </div>
              {selectedFaction && (
                <div className="mt-2 p-2 rounded bg-background/50 text-center animate-in slide-in-from-top duration-200">
                  <p className="text-[11px] text-foreground/80 italic">
                    {FACTIONS.find((f) => f.id === selectedFaction)?.desc}
                  </p>
                </div>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "submitting" || !displayName.trim() || !selectedFaction}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_oklch(0.78_0.2_145/15%)] disabled:opacity-50 flex items-center justify-center gap-2"
              id="btn-complete-onboarding"
            >
              {status === "submitting" ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Setting Up...
                </>
              ) : (
                "⚔️ Complete Setup"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
