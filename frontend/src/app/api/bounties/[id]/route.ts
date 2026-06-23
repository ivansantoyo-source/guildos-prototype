// ============================================================================
// GUILDOS — Bounty by ID API
// PATCH /api/bounties/[id] — Update bounty (status, fulfillment, etc.)
// DELETE /api/bounties/[id] — Cancel a bounty
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDemoModeServer } from "@/lib/toggles/server";
import { phantomBounties, phantomBountyStats } from "@/mocks/phantomData";
import { createClient } from "@/lib/supabase/server";
import { withHardening } from "@/lib/auth/server-auth";
import type { ValidatedNextRequest } from "@/lib/auth/server-auth";
import { BountyUpdateSchema } from "@/lib/validation/schemas";
import type { Bounty } from "@/lib/types";
import { creditWallet, getDemoWallet } from "@/lib/wallet";

// ============================================================================
// Helpers
// ============================================================================

const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["CLAIMED", "CANCELLED"],
  CLAIMED: ["IN_TRANSIT", "DISPUTED"],
  IN_TRANSIT: ["RECEIVED", "DISPUTED"],
  RECEIVED: ["VERIFIED", "DISPUTED"],
  VERIFIED: ["PAID", "DISPUTED"],
  PAID: [],
  DISPUTED: ["VERIFIED", "CANCELLED"],
};

function isValidTransition(current: string, next: string): boolean {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed) return false;
  return allowed.includes(next);
}

function extractId(request: NextRequest): string {
  const segments = request.nextUrl.pathname.split("/");
  return segments[segments.length - 1] || "";
}

// ============================================================================
// PATCH /api/bounties/[id]
// Update bounty fields — supports status transitions, fulfillment pipeline,
// price updates, and general field modifications.
// Auth: admin or owner (admin/owner roles required)
// Rate: 20/min
// ============================================================================
export const PATCH = withHardening(
  async (request: NextRequest, session) => {
    const id = extractId(request);
    const data = (request as ValidatedNextRequest<z.infer<typeof BountyUpdateSchema>>).validatedData;
    const { searchParams } = request.nextUrl;
    const demoMode = await isDemoModeServer(searchParams);

    try {
      // Demo mode — update phantom data
      if (demoMode) {
        const index = phantomBounties.findIndex((b) => b.id === id);
        if (index === -1) {
          return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
        }

        // Validate fulfillment status transitions
        if (data.fulfillment_status) {
          const currentStatus = phantomBounties[index].fulfillment_status || "OPEN";
          const valid = isValidTransition(currentStatus, data.fulfillment_status);
          if (!valid) {
            return NextResponse.json(
              { error: `Invalid transition from ${currentStatus} to ${data.fulfillment_status}` },
              { status: 400 }
            );
          }
        }

        const updated = {
          ...phantomBounties[index],
          ...data,
          updated_at: new Date().toISOString(),
        };

        // Auto-set timestamps for pipeline steps
        if (data.fulfillment_status === "CLAIMED" && !updated.claimed_at) {
          updated.claimed_at = new Date().toISOString();
        }
        if (data.fulfillment_status === "PAID" && !updated.fulfilled_at) {
          updated.fulfilled_at = new Date().toISOString();
          updated.status = "FULFILLED";

          // Credit fulfiller's wallet (demo mode simulation)
          const storeCredit = updated.store_credit_value || 0;
          const fulfillerProfileId = updated.fulfilled_by_profile;
          if (storeCredit > 0 && fulfillerProfileId) {
            const demoWallet = getDemoWallet();
            const creditResult = creditWallet(
              demoWallet,
              storeCredit,
              "CREDIT_BOUNTY",
              "bounty",
              updated.id,
              `Bounty fulfilled: ${updated.target_item_name}`
            );
            console.log(
              `[bounties:PAYMENT] DEMO — Credited wallet for ${fulfillerProfileId}: ` +
              `+$${storeCredit.toFixed(2)} (bounty ${updated.id})`
            );
            console.log(
              `[bounties:PAYMENT] DEMO — Wallet balance now $${creditResult.wallet.balance.toFixed(2)}`
            );

            // Update bounty stats for the fulfiller
            const statsIndex = phantomBountyStats.findIndex(
              (s) => s.profile_id === fulfillerProfileId
            );
            if (statsIndex !== -1) {
              phantomBountyStats[statsIndex] = {
                ...phantomBountyStats[statsIndex],
                total_earned: phantomBountyStats[statsIndex].total_earned + storeCredit,
                current_claims: Math.max(0, phantomBountyStats[statsIndex].current_claims - 1),
                updated_at: new Date().toISOString(),
              };
            }
          }
        }
        if (data.status === "CANCELLED") {
          updated.status = "CANCELLED";
          // fulfillment_status stays as-is when cancelling
        }

        // Update in-place (for in-memory consistency)
        phantomBounties[index] = updated as Bounty;

        return NextResponse.json({ data: updated, source: "demo" });
      }

      // Production mode — update Supabase
      const supabase = await createClient();

      // Fetch current state for transition validation (scoped to org)
      if (data.fulfillment_status) {
        const { data: current } = await supabase
          .from("bounties")
          .select("fulfillment_status")
          .eq("id", id)
          .eq("organization_id", session.organization_id)
          .single();

        if (current) {
          const currentStatus = (current as { fulfillment_status?: string }).fulfillment_status || "OPEN";
          if (!isValidTransition(currentStatus, data.fulfillment_status)) {
            return NextResponse.json(
              { error: `Invalid transition from ${currentStatus} to ${data.fulfillment_status}` },
              { status: 400 }
            );
          }
        }
      }

      // Build update payload (exclude internal fields)
      const updatePayload: Record<string, unknown> = {};
      const dataRecord = data as Record<string, unknown>;
      const allowedFields = [
        "status", "fulfillment_status", "claimed_by", "fulfilled_by_profile",
        "condition_notes", "serial_number", "base_market_price", "scarcity_mult",
        "store_credit_value", "trigger_price", "description", "expires_at",
      ];

      for (const field of allowedFields) {
        if (field in dataRecord) {
          updatePayload[field] = dataRecord[field];
        }
      }

      // Auto-set timestamps
      if (data.fulfillment_status === "CLAIMED") {
        updatePayload.claimed_at = new Date().toISOString();
      }
      if (data.fulfillment_status === "PAID") {
        updatePayload.fulfilled_at = new Date().toISOString();
        updatePayload.status = "FULFILLED";
      }
      if (data.status === "CANCELLED") {
        updatePayload.status = "CANCELLED";
        // fulfillment_status stays as-is when cancelling
      }

      updatePayload.updated_at = new Date().toISOString();

      const { data: result, error } = await supabase
        .from("bounties")
        .update(updatePayload)
        .eq("id", id)
        .eq("organization_id", session.organization_id)
        .select()
        .single();

      if (error) {
        console.error("[bounties:PATCH] Supabase error:", error.message);
        return NextResponse.json({ error: "Failed to update bounty" }, { status: 500 });
      }

      // Wallet credit on PAID transition
      if (data.fulfillment_status === "PAID") {
        const storeCredit = (result as Record<string, unknown>)?.store_credit_value as number || 0;
        const fulfillerProfileId = (result as Record<string, unknown>)?.fulfilled_by_profile as string;
        const targetItem = (result as Record<string, unknown>)?.target_item_name as string || "unknown";

        if (storeCredit > 0 && fulfillerProfileId) {
          try {
            // Find or create wallet for the fulfiller
            const { data: wallet } = await supabase
              .from("wallets")
              .select("*")
              .eq("profile_id", fulfillerProfileId)
              .eq("organization_id", session.organization_id)
              .maybeSingle();

            const walletId = wallet?.id;

            if (walletId) {
              // Update wallet balance
              await supabase
                .from("wallets")
                .update({
                  balance: (wallet.balance || 0) + storeCredit,
                  total_earned: (wallet.total_earned || 0) + storeCredit,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", walletId);

              // Create wallet transaction record
              await supabase
                .from("wallet_transactions")
                .insert({
                  wallet_id: walletId,
                  profile_id: fulfillerProfileId,
                  type: "CREDIT_BOUNTY",
                  amount: storeCredit,
                  description: `Bounty fulfilled: ${targetItem}`,
                  reference_type: "bounty",
                  reference_id: id,
                });

              // Update bounty stats for the fulfiller
              const { data: currentStats } = await supabase
                .from("bounty_stats")
                .select("id, total_earned, current_claims")
                .eq("profile_id", fulfillerProfileId)
                .eq("organization_id", session.organization_id)
                .maybeSingle();

              if (currentStats) {
                await supabase
                  .from("bounty_stats")
                  .update({
                    total_earned: (currentStats.total_earned || 0) + storeCredit,
                    current_claims: Math.max(0, (currentStats.current_claims || 0) - 1),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", currentStats.id);
              }

              console.log(
                `[bounties:PAYMENT] Credited wallet ${walletId} for ${fulfillerProfileId}: ` +
                `+$${storeCredit.toFixed(2)} (bounty ${id})`
              );
            } else {
              console.warn(
                `[bounties:PAYMENT] No wallet found for profile ${fulfillerProfileId}. ` +
                `Cannot credit $${storeCredit.toFixed(2)} for bounty ${id}`
              );
            }
          } catch (walletErr) {
            // Log but don't fail the response — bounty was already marked PAID
            console.error("[bounties:PAYMENT] Wallet credit failed:", walletErr);
          }
        }
      }

      return NextResponse.json({ data: result, source: "production" });

    } catch (err) {
      console.error("[bounties:PATCH] Error:", err);
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  },
  {
    roles: ["admin", "owner"],
    schema: BountyUpdateSchema,
    rateLimit: { key: "bounty-update", maxRequests: 20, windowMs: 60_000 },
  }
);

// ============================================================================
// DELETE /api/bounties/[id]
// Cancel/remove a bounty. Sets status to CANCELLED.
// Auth: admin or owner
// Rate: 10/min (stricter — destructive operation)
// ============================================================================
export const DELETE = withHardening(
  async (request: NextRequest, session) => {
    const id = extractId(request);
    const { searchParams } = request.nextUrl;
    const demoMode = await isDemoModeServer(searchParams);

    // Demo mode — soft-delete phantom bounty
    if (demoMode) {
      const index = phantomBounties.findIndex((b) => b.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
      }

      phantomBounties[index] = {
        ...phantomBounties[index],
        status: "CANCELLED" as const,
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({ data: phantomBounties[index], source: "demo" });
    }

    // Production mode — update status to CANCELLED (soft delete, scoped to org)
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("bounties")
        .update({
          status: "CANCELLED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", session.organization_id)
        .select()
        .single();

      if (error) {
        console.error("[bounties:DELETE] Supabase error:", error.message);
        return NextResponse.json({ error: "Failed to cancel bounty" }, { status: 500 });
      }

      return NextResponse.json({ data, source: "production" });

    } catch (err) {
      console.error("[bounties:DELETE] Error:", err);
      return NextResponse.json({ error: "Failed to cancel bounty" }, { status: 500 });
    }
  },
  {
    roles: ["admin", "owner"],
    rateLimit: { key: "bounty-delete", maxRequests: 10, windowMs: 60_000 },
  }
);
