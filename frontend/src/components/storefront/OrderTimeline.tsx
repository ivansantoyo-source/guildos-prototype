"use client";

import React from "react";
import { motion } from "framer-motion";
import { useGuildStore } from "@/lib/store/useGuildStore";
import type { OrderStatus } from "@/lib/types";

// ============================================================
// ORDER STATUS TIMELINE — Visual progress for order fulfillment
// ============================================================
interface OrderTimelineProps {
  status: OrderStatus;
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "PENDING", label: "Pending", icon: "📝" },
  { key: "CONFIRMED", label: "Confirmed", icon: "✅" },
  { key: "PROCESSING", label: "Processing", icon: "⚙️" },
  { key: "READY_FOR_PICKUP", label: "Ready / Shipped", icon: "📦" },
  { key: "DELIVERED", label: "Delivered", icon: "🎉" },
];

const CANCELLED_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "PENDING", label: "Pending", icon: "📝" },
  { key: "CANCELLED", label: "Cancelled", icon: "❌" },
];

const REFUNDED_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "CANCELLED", label: "Cancelled", icon: "❌" },
  { key: "REFUNDED", label: "Refunded", icon: "💳" },
];

export default function OrderTimeline({ status }: OrderTimelineProps) {
  const reducedMotion = useGuildStore((s) => s.reducedMotion);

  const isCancelled = status === "CANCELLED";
  const isRefunded = status === "REFUNDED";

  const steps = isRefunded ? REFUNDED_STEPS : isCancelled ? CANCELLED_STEPS : STATUS_STEPS;

  const currentStepIdx = steps.findIndex((s) => s.key === status);
  const showStep = currentStepIdx >= 0;

  return (
    <div className="w-full" role="progressbar" aria-label={`Order status: ${status}`} aria-valuenow={currentStepIdx + 1} aria-valuemin={1} aria-valuemax={steps.length}>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIdx;
          const isCurrent = idx === currentStepIdx;
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={step.key}>
              {/* Step node */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={reducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
                    isCompleted
                      ? "bg-xp/20 border-xp text-xp"
                      : isCurrent
                        ? "bg-primary/20 border-primary text-primary animate-neon-pulse"
                        : isCancelled || isRefunded
                          ? "bg-destructive/10 border-destructive/30 text-destructive"
                          : "bg-muted/20 border-muted/30 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <span className="text-xs">✓</span>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </motion.div>
                <span
                  className={`text-[9px] mt-1 font-medium whitespace-nowrap ${
                    isCurrent
                      ? "text-primary font-bold"
                      : isCompleted
                        ? "text-xp"
                        : "text-muted-foreground/60"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-1">
                  <div
                    className={`h-0.5 rounded-full transition-all duration-500 ${
                      idx < currentStepIdx
                        ? "bg-xp/50"
                        : isCancelled || isRefunded
                          ? "bg-destructive/30"
                          : "bg-muted/30"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status label */}
      {showStep && (
        <p className="text-center text-[11px] text-muted-foreground mt-3">
          {isRefunded
            ? "This order has been refunded."
            : isCancelled
              ? "This order was cancelled."
              : currentStepIdx === STATUS_STEPS.length - 1
                ? "Your order has been delivered. Enjoy!"
                : `Current status: ${steps[currentStepIdx].label}`}
        </p>
      )}
    </div>
  );
}
