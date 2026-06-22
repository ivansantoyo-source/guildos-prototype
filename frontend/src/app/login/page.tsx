"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Faction } from "@/lib/types";

const FACTIONS: { id: Faction; name: string; icon: string; color: string; desc: string }[] = [
  { id: "SEGA_SYNDICATE", name: "Sega Syndicate", icon: "🔵", color: "border-faction-sega/40 bg-faction-sega/10", desc: "Speed, style, and the 16-bit wars" },
  { id: "NINTENDO_NOMADS", name: "Nintendo Nomads", icon: "🔴", color: "border-faction-nintendo/40 bg-faction-nintendo/10", desc: "Quality, nostalgia, and iconic IPs" },
  { id: "SONY_SENTINELS", name: "Sony Sentinels", icon: "🟣", color: "border-faction-sony/40 bg-faction-sony/10", desc: "Innovation, 3D era, and JRPGs" },
];

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In demo mode, just redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-legendary/5 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-legendary/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🎮</span>
            <span className="text-2xl font-bold text-primary text-glow-green tracking-wider">
              GUILD_OS
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">
            {isRegister ? "Create your merchant account" : "Sign in to your terminal"}
          </p>
        </div>

        {/* Form Card */}
        <div className="guild-card bg-card rounded-xl p-6 border-primary/20 shadow-[0_0_30px_oklch(0.78_0.2_145/5%)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@guildos.com"
                className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
                id="input-login-email"
              />
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
                id="input-login-password"
              />
            </div>

            {/* Faction Selection (Registration only) */}
            {isRegister && (
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-2">
                  Choose Your Faction
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FACTIONS.map((faction) => (
                    <button
                      key={faction.id}
                      type="button"
                      onClick={() => setSelectedFaction(faction.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedFaction === faction.id
                          ? `${faction.color} shadow-lg`
                          : "border-border bg-background hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="text-xl block">{faction.icon}</span>
                      <span className="text-[10px] text-foreground/70 block mt-1">{faction.name}</span>
                    </button>
                  ))}
                </div>
                {selectedFaction && (
                  <p className="text-[11px] text-muted-foreground mt-2 text-center italic">
                    {FACTIONS.find((f) => f.id === selectedFaction)?.desc}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-guild"
                className="w-3.5 h-3.5 rounded border-border bg-background"
              />
              <label htmlFor="remember-guild" className="text-xs text-muted-foreground">
                Remember this Guild
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_oklch(0.78_0.2_145/15%)]"
              id="btn-login-submit"
            >
              {isRegister ? "⚔️ DEPLOY GUILD" : "⚔️ ENTER TERMINAL"}
            </button>
          </form>

          {/* Demo Mode Quick Access */}
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2.5 rounded-lg bg-gold/10 border border-gold/20 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
              id="btn-demo-mode"
            >
              ⚡ Launch Demo Mode (No Account Required)
            </button>
          </div>

          {/* Toggle Register/Login */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            {isRegister ? "Already have a terminal?" : "Need a terminal?"}{" "}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary hover:underline"
            >
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
