import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { KonamiListener } from "@/components/konami/KonamiListener";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Use the same font for sans since GuildOS is terminal-themed
const fontSans = JetBrains_Mono({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GuildOS — Retro Gaming Command Center",
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
        <KonamiListener />
        {children}
      </body>
    </html>
  );
}
