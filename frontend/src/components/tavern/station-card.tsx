"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Gamepad2, Sofa, Users, Scan, Wrench, AlertCircle, Loader2 } from "lucide-react";
import type { Station } from "@/lib/types";

// ============================================================================
// GUILDOS — Station Card Component
// Glass card showing station details with action buttons
// ============================================================================

const TYPE_ICONS: Record<string, React.ElementType> = {
  PC: Monitor,
  CONSOLE: Gamepad2,
  TABLETOP: Users,
  COUCH: Sofa,
  VR: Scan,
  ARCADE: Gamepad2,
};

const TYPE_LABELS: Record<string, string> = {
  PC: "PC Gaming",
  CONSOLE: "Console",
  TABLETOP: "Tabletop",
  COUCH: "Couch Co-op",
  VR: "VR Station",
  ARCADE: "Arcade",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  AVAILABLE: {
    label: "Available",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    dot: "bg-green-500",
  },
  OCCUPIED: {
    label: "Occupied",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    dot: "bg-red-500",
  },
  MAINTENANCE: {
    label: "Maintenance",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    dot: "bg-yellow-500",
  },
  OFFLINE: {
    label: "Offline",
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/30",
    dot: "bg-gray-500",
  },
};

interface StationCardProps {
  station: Station;
  onBook?: (station: Station) => void;
  onViewDetails?: (station: Station) => void;
  className?: string;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================
export function StationCardSkeleton() {
  return (
    <div className="guild-card bg-card rounded-lg p-5 border-border/20 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded-full" />
      </div>
      <div className="h-5 w-32 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
      <div className="h-8 w-full bg-muted rounded" />
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================
export function StationCardEmpty({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="guild-card bg-card rounded-lg p-8 border-border/20 text-center">
      <Monitor className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
      <h3 className="text-sm font-bold text-primary mb-1">No Stations</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
        No tavern stations configured yet. Add stations in Settings to get started.
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-xs rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
        >
          Refresh
        </button>
      )}
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================
export function StationCardError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="guild-card bg-card rounded-lg p-8 border-destructive/30 text-center">
      <AlertCircle className="w-10 h-10 mx-auto text-destructive mb-3" />
      <h3 className="text-sm font-bold text-destructive mb-1">Failed to Load</h3>
      <p className="text-xs text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs rounded bg-destructive/20 text-destructive font-bold hover:bg-destructive/30 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN STATION CARD — Memoized for render performance
// ============================================================================
const StationCard = React.memo(({ station, onBook, onViewDetails, className = "" }: StationCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = TYPE_ICONS[station.station_type] ?? Monitor;
  const typeLabel = TYPE_LABELS[station.station_type] ?? station.station_type;
  const status = STATUS_CONFIG[station.status] ?? STATUS_CONFIG.OFFLINE;
  const isAvailable = station.status === "AVAILABLE";
  const isOccupied = station.status === "OCCUPIED";

  return (
    <motion.div
      className={`guild-card bg-card rounded-lg overflow-hidden border transition-all duration-200 ${status.bg} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Status bar */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.dot} ${isAvailable ? "animate-neon-pulse" : ""}`} />
          <span className={`text-[11px] font-bold ${status.color}`}>{status.label}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gold font-mono font-bold">
          <span>$</span>
          <span>{station.hourly_rate}</span>
          <span className="text-[10px] text-muted-foreground font-normal">/hr</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Icon + Name */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isAvailable ? "bg-primary/10" : "bg-muted/30"}`}>
            <Icon className={`w-5 h-5 ${isAvailable ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground truncate">{station.name}</h3>
            <p className="text-[11px] text-muted-foreground">{typeLabel}</p>
          </div>
        </div>

        {/* Zone badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
            {station.zone.replace(/_/g, " ")}
          </span>
        </div>

        {/* Current game (occupied only) */}
        {isOccupied && station.current_game && (
          <div className="bg-muted/30 rounded px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Currently Playing</p>
            <p className="text-xs text-primary font-bold truncate">🎮 {station.current_game}</p>
          </div>
        )}

        {/* Maintenance notice */}
        {station.status === "MAINTENANCE" && (
          <div className="bg-yellow-500/10 rounded px-3 py-2 flex items-center gap-2">
            <Wrench className="w-3 h-3 text-yellow-400" />
            <p className="text-[10px] text-yellow-400">Undergoing maintenance</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          {isAvailable && onBook && (
            <motion.button
              onClick={() => onBook(station)}
              className="flex-1 py-2.5 text-xs rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/20 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              📅 Book Now
            </motion.button>
          )}
          {!isAvailable && onViewDetails && (
            <button
              onClick={() => onViewDetails(station)}
              className="flex-1 py-2.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
export default StationCard;
