"use client";

import React, { useEffect } from "react";
import { useGuildStore } from "@/lib/store/useGuildStore";
import {
  phantomInventory,
  phantomBounties,
  phantomDashboardStats,
  phantomOrders,
  phantomStorefrontConfig,
  phantomNotifications,
} from "@/mocks/phantomData";

/**
 * Tenant Storefront Layout
 * Seeds phantom data for ALL storefront pages when in demo mode.
 * The [tenant] route group uses the root layout, not the merchant layout,
 * so we need our own data seeding here.
 */
export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demoMode = useGuildStore((s) => s.demoMode);
  const inventory = useGuildStore((s) => s.inventory);
  const setInventory = useGuildStore((s) => s.setInventory);
  const setBounties = useGuildStore((s) => s.setBounties);
  const setDashboardStats = useGuildStore((s) => s.setDashboardStats);
  const setCustomerOrders = useGuildStore((s) => s.setCustomerOrders);
  const setStorefrontConfig = useGuildStore((s) => s.setStorefrontConfig);
  const setNotifications = useGuildStore((s) => s.setNotifications);

  useEffect(() => {
    if (demoMode && inventory.length === 0) {
      setInventory(phantomInventory);
      setBounties(phantomBounties);
      setDashboardStats(phantomDashboardStats);
      setCustomerOrders(phantomOrders);
      setStorefrontConfig(phantomStorefrontConfig);
      setNotifications(phantomNotifications);
    }
  }, [demoMode, inventory.length, setInventory, setBounties, setDashboardStats, setCustomerOrders, setStorefrontConfig, setNotifications]);

  return <>{children}</>;
}
