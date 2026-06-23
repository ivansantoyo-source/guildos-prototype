"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Gamepad2, Sofa, Users, Scan, Wrench } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  station_type: string;
  zone: string;
  position_x: number;
  position_y: number;
  status: string;
  current_game?: string;
  current_player_id?: string;
  hourly_rate: number;
}

interface LiveMapProps {
  stations: Station[];
  onStationClick?: (station: Station) => void;
  onBookStation?: (station: Station) => void;
  className?: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  PC: Monitor,
  CONSOLE: Gamepad2,
  TABLETOP: Users,
  COUCH: Sofa,
  VR: Scan,
  ARCADE: Gamepad2,
};

const STATUS_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
  AVAILABLE: {
    fill: 'rgba(34, 197, 94, 0.2)',
    stroke: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.15)',
  },
  OCCUPIED: {
    fill: 'rgba(239, 68, 68, 0.2)',
    stroke: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.2)',
  },
  MAINTENANCE: {
    fill: 'rgba(156, 163, 175, 0.15)',
    stroke: '#9ca3af',
    glow: 'rgba(156, 163, 175, 0.08)',
  },
  OFFLINE: {
    fill: 'rgba(75, 85, 99, 0.1)',
    stroke: '#4b5563',
    glow: 'rgba(75, 85, 99, 0.05)',
  },
};

const ZONE_COLORS: Record<string, string> = {
  MAIN: '#3b82f6',
  VIP: '#a855f7',
  'CONSOLE_ALLEY': '#22c55e',
  TABLETOP_CORNER: '#eab308',
  VR_ZONE: '#06b6d4',
  ARCADE_ROW: '#f97316',
};

/** Draw an isometric cube (simple 2D isometric projection) */
function IsometricCube({
  x,
  y,
  size,
  colors,
  glowIntensity,
}: {
  x: number;
  y: number;
  size: number;
  colors: { fill: string; stroke: string; glow: string };
  glowIntensity: number;
}) {
  const halfW = size * 0.7;
  const halfH = size * 0.4;

  // Isometric top face
  const topPoints = `${x},${y} ${x + halfW},${y - halfH} ${x},${y - halfH * 2} ${x - halfW},${y - halfH}`;

  // Left face
  const leftPoints = `${x - halfW},${y - halfH} ${x},${y - halfH * 2} ${x},${y + size * 0.3 - halfH * 2} ${x - halfW},${y + size * 0.3 - halfH}`;

  // Right face
  const rightPoints = `${x},${y - halfH * 2} ${x + halfW},${y - halfH} ${x + halfW},${y + size * 0.3 - halfH} ${x},${y + size * 0.3 - halfH * 2}`;

  return (
    <g>
      {/* Glow for occupied */}
      {glowIntensity > 0 && (
        <ellipse cx={x} cy={y} rx={halfW * 0.8} ry={halfH * 0.8} fill={colors.glow}>
          <animate attributeName="opacity" values={`${0.2 * glowIntensity};${0.4 * glowIntensity};${0.2 * glowIntensity}`} dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Left face (dark) */}
      <polygon points={leftPoints} fill={colors.fill} stroke={colors.stroke} strokeWidth={1} opacity={0.6} />

      {/* Right face (medium) */}
      <polygon points={rightPoints} fill={colors.fill} stroke={colors.stroke} strokeWidth={1} opacity={0.8} />

      {/* Top face (light) */}
      <polygon points={topPoints} fill={colors.fill} stroke={colors.stroke} strokeWidth={1} />
    </g>
  );
}

export default function LiveMap({ stations, onStationClick, onBookStation, className = '' }: LiveMapProps) {
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  if (stations.length === 0) {
    return (
      <div className={`flex items-center justify-center p-12 rounded-2xl bg-[var(--bg-secondary)]/30 border border-dashed border-[var(--border-primary)] ${className}`}>
        <p className="text-sm text-[var(--text-tertiary)]">No stations configured. Add stations in Settings → Tavern Layout.</p>
      </div>
    );
  }

  // Auto-layout if no coordinates set
  const hasPositions = stations.some((s) => s.position_x !== 0 || s.position_y !== 0);
  const layoutStations = hasPositions ? stations : stations.map((s, i) => ({
    ...s,
    position_x: 100 + (i % 4) * 120,
    position_y: 80 + Math.floor(i / 4) * 100,
  }));

  // Calculate SVG bounds
  const maxX = Math.max(...layoutStations.map((s) => s.position_x)) + 60;
  const maxY = Math.max(...layoutStations.map((s) => s.position_y)) + 60;

  const handleStationClick = (s: Station) => {
    setSelectedStation(s);
    onStationClick?.(s);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Zone Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(ZONE_COLORS).map(([zone, color]) => (
          <span key={zone} className="px-2 py-1 rounded-full text-[10px] font-medium" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
            {zone.replace('_', ' ')}
          </span>
        ))}
      </div>

      {/* SVG Map */}
      <svg
        viewBox={`0 0 ${Math.max(600, maxX + 20)} ${Math.max(400, maxY + 20)}`}
        className="w-full h-auto rounded-2xl bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]"
      >
        {/* Grid lines for spatial reference */}
        <defs>
          <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="var(--border-primary)" strokeWidth={0.5} opacity={0.3} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Zone labels */}
        {Object.entries(ZONE_COLORS).map(([zone, color]) => {
          const zoneStations = layoutStations.filter((s) => s.zone === zone);
          if (zoneStations.length === 0) return null;
          const avgX = zoneStations.reduce((sum, s) => sum + s.position_x, 0) / zoneStations.length;
          const avgY = zoneStations.reduce((sum, s) => sum + s.position_y, 0) / zoneStations.length;
          return (
            <text key={zone} x={avgX} y={avgY - 45} textAnchor="middle" fill={color} fontSize={11} fontWeight={600} opacity={0.6}>
              {zone.replace('_', ' ')}
            </text>
          );
        })}

        {/* Stations */}
        {layoutStations.map((station) => {
          const colors = STATUS_COLORS[station.status] ?? STATUS_COLORS.OFFLINE;
          const isHovered = hoveredStation === station.id;
          const isSelected = selectedStation?.id === station.id;
          const Icon = TYPE_ICONS[station.station_type] ?? Monitor;
          const glowIntensity = station.status === 'OCCUPIED' ? 1 : 0;

          return (
            <g
              key={station.id}
              onMouseEnter={() => setHoveredStation(station.id)}
              onMouseLeave={() => setHoveredStation(null)}
              onClick={() => handleStationClick(station)}
              className="cursor-pointer"
            >
              <IsometricCube
                x={station.position_x}
                y={station.position_y}
                size={isHovered ? 44 : 40}
                colors={colors}
                glowIntensity={glowIntensity}
              />

              {/* Station icon on top */}
              <foreignObject
                x={station.position_x - 10}
                y={station.position_y - 26}
                width={20}
                height={20}
                style={{ pointerEvents: 'none' }}
              >
                <Icon className="w-5 h-5" style={{ color: colors.stroke }} />
              </foreignObject>

              {/* Label */}
              <text
                x={station.position_x}
                y={station.position_y + 30}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize={isHovered ? 11 : 10}
                fontWeight={isHovered ? 600 : 400}
              >
                {station.name}
              </text>

              {/* Current game tooltip */}
              {station.current_game && isHovered && (
                <text
                  x={station.position_x}
                  y={station.position_y + 44}
                  textAnchor="middle"
                  fill="var(--text-tertiary)"
                  fontSize={9}
                >
                  🎮 {station.current_game}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Selected Station Detail */}
      {selectedStation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--border-primary)]"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{selectedStation.name}</h3>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: `${STATUS_COLORS[selectedStation.status]?.stroke}22`,
                color: STATUS_COLORS[selectedStation.status]?.stroke,
                border: `1px solid ${STATUS_COLORS[selectedStation.status]?.stroke}44`,
              }}
            >
              {selectedStation.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
            <div>Type: <span className="text-[var(--text-primary)]">{selectedStation.station_type}</span></div>
            <div>Zone: <span className="text-[var(--text-primary)]">{selectedStation.zone}</span></div>
            <div>Rate: <span className="text-[var(--gold-primary)]">${selectedStation.hourly_rate}/hr</span></div>
            {selectedStation.current_game && (
              <div>Game: <span className="text-[var(--neon-primary)]">{selectedStation.current_game}</span></div>
            )}
          </div>

          {selectedStation.status === 'AVAILABLE' && onBookStation && (
            <button
              onClick={() => onBookStation(selectedStation)}
              className="mt-3 w-full py-2 rounded-lg bg-[var(--neon-primary)] text-black font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Book This Station
            </button>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-3 justify-center">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colors.stroke }} />
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}
