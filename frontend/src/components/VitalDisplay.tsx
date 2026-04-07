/**
 * Component for displaying vital signs with large numbers and status indicators.
 */

'use client';

import React from 'react';
import { AlertCircle, Heart } from 'lucide-react';

interface VitalDisplayProps {
  label: string;
  value: number;
  unit: string;
  status?: 'normal' | 'warning' | 'critical';
  icon?: React.ReactNode;
  secondaryLabel?: string;
  secondaryValue?: number;
}

/**
 * Display a large vital sign value with color-coded status indicator.
 *
 * @param label - Label for the vital (e.g., "Heart Rate")
 * @param value - Numeric value to display
 * @param unit - Unit of measurement (e.g., "bpm", "%")
 * @param status - Status level: 'normal' (green), 'warning' (yellow), 'critical' (red)
 * @param icon - Optional React icon component
 * @param secondaryLabel - Optional secondary label (e.g., "Range")
 * @param secondaryValue - Optional secondary value
 * @returns React component
 */
export function VitalDisplay({
  label,
  value,
  unit,
  status = 'normal',
  icon,
  secondaryLabel,
  secondaryValue,
}: VitalDisplayProps) {
  // Color classes based on status
  const statusColors = {
    normal: {
      background: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      badge: 'bg-emerald-900/40 text-emerald-300',
    },
    warning: {
      background: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      badge: 'bg-yellow-900/40 text-yellow-300',
    },
    critical: {
      background: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-900/40 text-red-300',
    },
  };

  const colors = statusColors[status];

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border backdrop-blur-sm
        transition-all duration-300 hover:scale-105
        ${colors.background} ${colors.border}
      `}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-0 hover:opacity-10 bg-gradient-to-r from-transparent via-white to-transparent transition-opacity" />

      <div className="relative p-4 space-y-3">
        {/* Header with label and status badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <div className={`text-xl ${colors.text}`}>
                {icon}
              </div>
            )}
            <span className="text-sm font-medium text-slate-300">
              {label}
            </span>
          </div>
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
            ${colors.badge}
          `}>
            {status === 'critical' && <AlertCircle size={12} />}
            <span className="capitalize">{status}</span>
          </div>
        </div>

        {/* Main value display */}
        <div className="flex items-baseline gap-2">
          <span className={`
            text-5xl font-mono font-bold tracking-tight
            ${colors.text}
          `}>
            {Math.round(value * 10) / 10}
          </span>
          <span className="text-xl font-medium text-slate-400">
            {unit}
          </span>
        </div>

        {/* Optional secondary value */}
        {secondaryLabel && secondaryValue !== undefined && (
          <div className="pt-2 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">{secondaryLabel}</p>
            <span className="text-lg font-mono font-semibold text-slate-300">
              {Math.round(secondaryValue * 10) / 10}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Component for displaying heart rate with dynamic indicator.
 */
export function HeartRateDisplay({ value, status = 'normal' }: { value: number; status?: 'normal' | 'warning' | 'critical' }) {
  return (
    <VitalDisplay
      label="Heart Rate"
      value={value}
      unit="bpm"
      status={status}
      icon={<Heart size={20} />}
    />
  );
}

/**
 * Component for displaying SpO2 with range indicator.
 */
export function SpO2Display({ value, average }: { value: number; average: number }) {
  // Determine status
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (value < 90) status = 'critical';
  else if (value < 95) status = 'warning';

  return (
    <VitalDisplay
      label="SpO2 (Oxygen Saturation)"
      value={value}
      unit="%"
      status={status}
      secondaryLabel="Average"
      secondaryValue={average}
    />
  );
}

/**
 * Grid layout for multiple vital displays.
 */
export function VitalDisplayGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  );
}
