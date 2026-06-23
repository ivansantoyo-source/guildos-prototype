"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Faction } from "@/lib/types";

const FACTIONS: { id: Faction; name: string; icon: string; color: string; border: string; bg: string; desc: string; members: number }[] = [
  { id: "SEGA_SYNDICATE", name: "Sega Syndicate", icon: "🔵", color: "text-faction-sega", border: "border-faction-sega/40", bg: "bg-faction-sega/10", desc: "Speed, style, and the 16-bit wars", members: 1240 },
  { id: "NINTENDO_NOMADS", name: "Nintendo Nomads", icon: "🔴", color: "text-faction-nintendo", border: "border-faction-nintendo/40", bg: "bg-faction-nintendo/10", desc: "Quality, nostalgia, and iconic IPs", members: 1560 },
  { id: "SONY_SENTINELS", name: "Sony Sentinels", icon: "🟣", color: "text-faction-sony", border: "border-faction-sony/40", bg: "bg-faction-sony/10", desc: "Innovation, 3D era, and JRPGs", members: 980 },
];

// Password strength meter
function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  if (!password) return null;

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = [
    "bg-destructive",
    "bg-destructive/70",
    "bg-gold/70",
    "bg-gold",
    "bg-xp",
    "bg-primary",
  ];

  return (
    <div className="mt-1">
      <div className="flex gap-1 h-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {labels[strength] || "Weak"}
      </p>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Faction animation on selection
  const [animatingFaction, setAnimatingFaction] = useState<Faction | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();

    if (isRegister) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { faction: selectedFaction },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setIsSubmitting(false);
        return;
      }
      setSignupSuccess(true);
      setIsSubmitting(false);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setIsSubmitting(false);
        return;
      }
      router.push("/dashboard");
    }
  };

  const handleFactionSelect = (id: Faction) => {
    setSelectedFaction(id);
    setAnimatingFaction(id);
    setTimeout(() => setAnimatingFaction(null), 600);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!forgotEmail.trim()) return;

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      forgotEmail,
      { redirectTo: `${window.location.origin}/login` }
    );
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setForgotSent(true);
  };

  // Forgot password flow
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-legendary/5 pointer-events-none" />
        <div className="relative w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">🎮</span>
              <span className="text-2xl font-bold text-primary text-glow-green tracking-wider">GUILD_OS</span>
            </Link>
          </div>

          <div className="guild-card bg-card rounded-xl p-6 border-primary/20">
            {forgotSent ? (
              <div className="text-center py-4">
                <span className="text-5xl block mb-4">📧</span>
                <h2 className="text-sm font-bold text-primary mb-2">Email Sent!</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  If an account exists for <span className="text-primary">{forgotEmail}</span>, you&apos;ll receive password reset instructions.
                </p>
                <button onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(""); }}
                  className="text-xs text-primary hover:underline">
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <h2 className="text-sm font-bold text-primary">🔑 Reset Password</h2>
                <p className="text-xs text-muted-foreground">Enter your email and we&apos;ll send you recovery instructions.</p>
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Email</label>
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="merchant@guildos.com"
                    className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground" />
                </div>
                {error && (
                  <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}
                <button type="submit" disabled={!forgotEmail.trim()}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50">
                  SEND RESET LINK
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  <button type="button" onClick={() => setShowForgotPassword(false)} className="text-primary hover:underline">
                    Back to Sign In
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-2xl font-bold text-primary text-glow-green tracking-wider">GUILD_OS</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">
            {isRegister ? "Create your merchant account" : "Sign in to your terminal"}
          </p>
        </div>

        {/* Form Card */}
        <div className="guild-card bg-card rounded-xl p-6 border-primary/20 shadow-[0_0_30px_oklch(0.78_0.2_145/5%)]">
          {signupSuccess ? (
            <div className="text-center py-4">
              <span className="text-5xl block mb-4">📧</span>
              <h2 className="text-sm font-bold text-primary mb-2">Check Your Email</h2>
              <p className="text-xs text-muted-foreground mb-4">
                We&apos;ve sent a verification link to <span className="text-primary">{email}</span>. Please check your inbox and verify your account before signing in.
              </p>
              <button onClick={() => { setSignupSuccess(false); setIsRegister(false); setEmail(""); setPassword(""); setError(null); }}
                className="text-xs text-primary hover:underline">
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@guildos.com"
                    className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
                    id="input-login-email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wider">Password</label>
                    {!isRegister && (
                      <button type="button" onClick={() => setShowForgotPassword(true)}
                        className="text-[10px] text-primary hover:underline">
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full px-3 py-2.5 text-sm bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
                    id="input-login-password"
                  />
                  {isRegister && <PasswordStrength password={password} />}
                </div>

                {/* Faction Selection (Registration only) */}
                {isRegister && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
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
                          } ${animatingFaction === faction.id ? "animate-level-up" : ""}`}
                        >
                          <span className="text-xl block">{faction.icon}</span>
                          <span className="text-[9px] text-foreground/70 block mt-1 truncate">{faction.name}</span>
                          <span className="text-[9px] text-muted-foreground block mt-0.5">{faction.members.toLocaleString()} members</span>
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
                )}

                {error && (
                  <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_oklch(0.78_0.2_145/15%)] disabled:opacity-50"
                  id="btn-login-submit"
                >
                  {isSubmitting ? "AUTHENTICATING..." : isRegister ? "⚔️ DEPLOY GUILD" : "⚔️ ENTER TERMINAL"}
                </button>
              </form>

              {/* OAuth Buttons */}
              <div className="mt-4 space-y-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: `${window.location.origin}/auth/callback` },
                      });
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">🔵</span>
                    Google
                  </button>
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signInWithOAuth({
                        provider: 'github',
                        options: { redirectTo: `${window.location.origin}/auth/callback` },
                      });
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">👤</span>
                    GitHub
                  </button>
                </div>
              </div>

              {/* Demo Mode Quick Access */}
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => router.push("/dashboard?demo=true")}
                  className="w-full py-2.5 rounded-lg bg-gold/10 border border-gold/20 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
                  id="btn-demo-mode"
                >
                  ⚡ Launch Demo Mode (No Account Required)
                </button>
              </div>

              {/* Terms and Privacy */}
              <div className="mt-3 text-center">
                <p className="text-[10px] text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <Link href="/" className="text-primary hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </div>

              {/* Toggle Register/Login */}
              <p className="text-xs text-muted-foreground text-center mt-4">
                {isRegister ? "Already have a terminal?" : "Need a terminal?"}{" "}
                <button
                  onClick={() => { setIsRegister(!isRegister); setError(null); setSignupSuccess(false); }}
                  className="text-primary hover:underline"
                >
                  {isRegister ? "Sign In" : "Register"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
