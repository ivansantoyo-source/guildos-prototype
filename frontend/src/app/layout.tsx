import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals-v2.css";
import { KonamiListener } from "@/components/konami/KonamiListener";
import { CommandPalette } from "@/components/ui/command-palette";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const fontSans = JetBrains_Mono({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "GuildOS — Retro Gaming Command Center",
    template: "%s | GuildOS",
  },
  description:
    "The multi-tenant SaaS platform that transforms retro-gaming storefronts into RPG-powered ecosystems. AI-driven inventory, gamified supply chains, and community-first design.",
  keywords: [
    "retro gaming",
    "POS system",
    "inventory management",
    "game store",
    "RPG",
    "GuildOS",
  ],
  openGraph: {
    title: "GuildOS — Retro Gaming Command Center",
    description:
      "Turn your game store into an RPG empire. AI-powered inventory, gamified supply chains, faction wars, and an AI shopkeeper that never sleeps.",
    siteName: "GuildOS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GuildOS — Retro Gaming Command Center",
    description:
      "Turn your game store into an RPG empire. AI-powered, gamified, community-first.",
  },
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://guildos.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ErrorBoundary>
          <KonamiListener />
          <CommandPalette />
          <Toaster />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
