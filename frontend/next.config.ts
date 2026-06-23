import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "cdn.guildos.com",
      },
    ],
  },
  async headers() {
    // Development mode needs unsafe-inline/eval for HMR and React DevTools;
    // production uses nonce-based script allowlisting for XSS protection.
    const isDevelopment = process.env.NODE_ENV === 'development';
    const cacheReadOnly = [
      { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=120" },
    ];
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), payment=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              isDevelopment
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com"
                : "script-src 'self' 'nonce-{nonce}' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.pricecharting.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "font-src 'self'",
              "report-uri /api/security/csp-report",
            ].join("; "),
          },
        ],
      },
      // Caching for read-heavy API GET endpoints -- data that changes infrequently
      // (bounties, inventory, scores, etc.) is served stale-up-to-120s while the CDN
      // revalidates, with a 60s max-age to reduce Supabase query load on every page load.
      { source: "/api/bounties", headers: cacheReadOnly },
      { source: "/api/inventory", headers: cacheReadOnly },
      { source: "/api/discounts", headers: cacheReadOnly },
      { source: "/api/nexus/scores", headers: cacheReadOnly },
      { source: "/api/nexus/lfg", headers: cacheReadOnly },
      { source: "/api/nexus/rooms", headers: cacheReadOnly },
      { source: "/api/ai/oracle", headers: cacheReadOnly },
      { source: "/api/audit/log", headers: cacheReadOnly },
      { source: "/api/tenant/settings", headers: cacheReadOnly },
      { source: "/api/potions/menu", headers: cacheReadOnly },
      { source: "/api/potions/orders", headers: cacheReadOnly },
      { source: "/api/tavern/bookings", headers: cacheReadOnly },
      { source: "/api/tavern/stations", headers: cacheReadOnly },
      { source: "/api/vitality/quests", headers: cacheReadOnly },
    ];
  },
};

export default nextConfig;
