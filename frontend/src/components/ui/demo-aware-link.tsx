"use client";

import React from "react";
import Link from "next/link";
import { demoHref } from "@/lib/utils/url";

// ============================================================================
// GUILDOS — DemoAwareLink
// Drop-in replacement for next/link that auto-preserves ?demo=true.
// Zero thought required — just use <DemoAwareLink href="/page"> instead of <Link>
// ============================================================================

interface DemoAwareLinkProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href: string;
  children: React.ReactNode;
}

export function DemoAwareLink({ href, children, ...props }: DemoAwareLinkProps) {
  const resolvedHref = demoHref(href);
  return (
    <Link href={resolvedHref} {...props}>
      {children}
    </Link>
  );
}

// Also export as a plain <a> tag version for non-Next.js usage
interface DemoAwareAnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function DemoAwareAnchor({ href, children, ...props }: DemoAwareAnchorProps) {
  const resolvedHref = demoHref(href);
  return (
    <a href={resolvedHref} {...props}>
      {children}
    </a>
  );
}
