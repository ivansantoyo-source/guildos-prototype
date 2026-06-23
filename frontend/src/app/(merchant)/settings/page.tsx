"use client";

import { useState, useEffect } from "react";
import type { TenantConfig } from "@/lib/types/tenant-keys";
import { BYO_SERVICES, PLATFORM_SERVICES, type BYOServiceKey } from "@/lib/types/tenant-keys";
import { toast } from "@/components/ui/toaster";

const FIELD_DEFS: Record<string, { label: string; placeholder: string; type: string; sensitive?: boolean }> = {
  "stripe.publishable_key": { label: "Publishable Key", placeholder: "pk_live_...", type: "text" },
  "stripe.secret_key": { label: "Secret Key", placeholder: "sk_live_...", type: "password", sensitive: true },
  "stripe.webhook_secret": { label: "Webhook Secret", placeholder: "whsec_...", type: "password", sensitive: true },
  "twilio.account_sid": { label: "Account SID", placeholder: "AC...", type: "text" },
  "twilio.auth_token": { label: "Auth Token", placeholder: "••••••••", type: "password", sensitive: true },
  "twilio.phone_number": { label: "Phone Number", placeholder: "+15551234567", type: "text" },
  "pricecharting.api_key": { label: "API Key", placeholder: "pc_...", type: "password", sensitive: true },
  "ai.nvidia_nim_api_key": { label: "NVIDIA NIM Key", placeholder: "nvapi-...", type: "password", sensitive: true },
  "iot.webhook_url": { label: "Webhook URL", placeholder: "https://hook.make.com/...", type: "text" },
};

// Hierarchical get/set for nested objects like stripe.publishable_key
function getNested(obj: Record<string, unknown>, path: string): string {
  return path.split(".").reduce((acc: unknown, key) => (acc && typeof acc === "object") ? (acc as Record<string, unknown>)[key] : undefined, obj) as string ?? "";
}

function setNested(obj: Record<string, unknown>, path: string, value: string): Record<string, unknown> {
  const keys = path.split(".");
  const result = { ...obj };
  let current: Record<string, unknown> = result;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"keys" | "store" | "features">("keys");

  useEffect(() => {
    fetch("/api/tenant/settings")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleChange = (path: string, value: string) => {
    if (!config) return;
    setConfig(setNested(config as unknown as Record<string, unknown>, path, value) as unknown as TenantConfig);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast("success", "Settings Saved", "Your tenant configuration has been updated.");
      } else {
        toast("error", "Save Failed", "Please try again.");
      }
    } catch {
      toast("error", "Save Failed", "Network error. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 bg-muted/60 animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted/60 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted/30 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary text-glow-green">⚙️ GUILD SETTINGS</h1>
          <p className="text-xs text-muted-foreground mt-1">Bring Your Own Keys · Store Configuration · Feature Management</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "SAVING..." : "💾 SAVE ALL CHANGES"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "keys" as const, label: "🔑 BYO API Keys", desc: "Stripe, Twilio, AI, IoT" },
          { id: "store" as const, label: "🏪 Store Info", desc: "Branding & contact" },
          { id: "features" as const, label: "🎮 Features", desc: "Toggle modules" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: API Keys */}
      {activeTab === "keys" && (
        <div className="space-y-6">
          {/* Platform Services (non-BYO) */}
          <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
            <h3 className="text-sm font-bold text-foreground mb-1">🖥️ Platform Services</h3>
            <p className="text-xs text-muted-foreground mb-4">These are managed by GuildOS and shared across all tenants. No configuration needed.</p>
            {Object.entries(PLATFORM_SERVICES).map(([key, svc]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{svc.name}</p>
                  <p className="text-[11px] text-muted-foreground">{svc.description}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">CONNECTED</span>
              </div>
            ))}
          </div>

          {/* BYO Services */}
          <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
            <h3 className="text-sm font-bold text-foreground mb-1">🔑 Bring Your Own Keys</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Each service is optional. Without keys, features gracefully degrade to demo/mock mode. Keys are encrypted at rest.
            </p>
            {Object.entries(BYO_SERVICES).map(([key, svc]) => {
              const serviceKey = key as BYOServiceKey;
              const isConfigured = key === "stripe" ? !!config?.stripe?.secret_key :
                key === "twilio" ? !!config?.twilio?.account_sid :
                key === "pricecharting" ? !!config?.pricecharting?.api_key :
                key === "ai" ? !!(config?.ai?.nvidia_nim_api_key) :
                key === "iot" ? !!config?.iot?.webhook_url : false;

              const fields = Object.entries(FIELD_DEFS).filter(([path]) => path.startsWith(`${key}.`));

              return (
                <div key={key} className="mb-4 pb-4 border-b border-border/50 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{svc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{svc.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={svc.docs_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">
                        Docs ↗
                      </a>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${
                        isConfigured
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-muted/50 text-muted-foreground border-border"
                      }`}>
                        {isConfigured ? "CONFIGURED" : "NOT SET"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.map(([path, def]) => (
                      <div key={path}>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {def.label}
                          {def.sensitive && <span className="text-gold ml-1">🔒</span>}
                        </label>
                        <input
                          type={def.type}
                          value={getNested(config as unknown as Record<string, unknown>, path)}
                          onChange={(e) => handleChange(path, e.target.value)}
                          placeholder={def.placeholder}
                          className="mt-1 w-full px-3 py-2 text-xs bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Store Info */}
      {activeTab === "store" && (
        <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
          <h3 className="text-sm font-bold text-foreground mb-4">🏪 Store Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { path: "store.name", label: "Store Name", placeholder: "Time Warp Gaming" },
              { path: "store.email", label: "Contact Email", placeholder: "hello@store.com" },
              { path: "store.phone", label: "Phone Number", placeholder: "(555) 123-4567" },
              { path: "store.address", label: "Address", placeholder: "123 Main St" },
              { path: "store.timezone", label: "Timezone", placeholder: "America/Los_Angeles" },
              { path: "store.currency", label: "Currency", placeholder: "USD" },
              { path: "store.tax_rate", label: "Tax Rate (%)", placeholder: "8.5" },
              { path: "branding.tagline", label: "Store Tagline", placeholder: "Where retro lives forever." },
            ].map(({ path, label, placeholder }) => (
              <div key={path}>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</label>
                <input
                  type="text"
                  value={getNested(config as unknown as Record<string, unknown>, path)}
                  onChange={(e) => handleChange(path, e.target.value)}
                  placeholder={placeholder}
                  className="mt-1 w-full px-3 py-2 text-xs bg-background border border-border rounded guild-input text-foreground placeholder:text-muted-foreground"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Features */}
      {activeTab === "features" && (
        <div className="guild-card bg-card rounded-lg p-5 border-primary/20">
          <h3 className="text-sm font-bold text-foreground mb-4">🎮 Feature Toggles</h3>
          <p className="text-xs text-muted-foreground mb-4">Enable or disable specific GuildOS modules. Tier restrictions may override these settings.</p>
          <div className="space-y-3">
            {[
              { key: "ai_shopkeeper", label: "AI Shopkeeper", desc: "DeepSeek-V3 powered conversational retail assistant", tier: "wizard" },
              { key: "vision_scanner", label: "Vision Loot Scanner", desc: "Camera-based inventory ingestion with AI appraisal", tier: "wizard" },
              { key: "sms_marketing", label: "SMS Marketing", desc: "Wandering Merchant alerts, Score Dethroned notifications", tier: "wizard" },
              { key: "b2b_network", label: "Inter-Guild Trade Network", desc: "Cross-tenant B2B arbitrage and wholesale proposals", tier: "time_lord" },
              { key: "nexus_unlimited", label: "Unlimited Nexus Access", desc: "Unlimited save rooms, LFG lobbies, and leaderboards", tier: "time_lord" },
            ].map(({ key, label, desc, tier }) => {
              const enabled = config?.features?.[key as keyof typeof config.features] ?? false;
              return (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{tier.toUpperCase()}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`Enable ${label}`}
                    onClick={() => handleChange(`features.${key}`, (!enabled).toString())}
                    className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
