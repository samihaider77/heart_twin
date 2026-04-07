/**
 * Component for displaying SpO2 (oxygen saturation) over time.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { SignalWindow } from '@/types/signals';

interface SpO2GraphProps {
  window: SignalWindow;
  average: number;
  samplingRate?: number;
}

/**
 * SpO2 (Oxygen Saturation) display with line graph.
 * Renders a hospital-style gauge with color-coded zones.
 *
 * @param window - Current visible signal window
 * @param average - Average SpO2 value
 * @param samplingRate - SpO2 sampling rate (default: 1 Hz)
 */
export function SpO2Graph({
  window,
  average,
  samplingRate = 1,
}: SpO2GraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get current SpO2 for status indicator
  const currentSpo2 = window.values.length > 0 ? window.values[0] : average;

  // Determine status color
  let statusColor: string;
  let statusText: string;
  if (currentSpo2 < 90) {
    statusColor = '#ff0000'; // Red - critical
    statusText = 'Critical';
  } else if (currentSpo2 < 95) {
    statusColor = '#ffaa00'; // Orange - warning
    statusText = 'Warning';
  } else {
    statusColor = '#00ff00'; // Green - normal
    statusText = 'Normal';
  }

  // Render graph
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Clear canvas with dark blue background
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, width, height);

    // Draw background zones
    drawZones(ctx, width, height);

    // Draw grid
    drawSpO2Grid(ctx, width, height);

    // Draw SpO2 waveform
    const values = window.values.length > 0 ? window.values : new Array(60).fill(average);
    drawSpO2Waveform(ctx, values, width, height);

  }, [window]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 rounded-lg border border-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800/50">
        <span className="text-blue-400 font-mono text-sm font-bold tracking-wider">
          SpO2 (Oxygen Saturation)
        </span>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-blue-300 font-mono text-xs text-slate-400">
              Status
            </div>
            <div className="font-mono text-2xl font-bold" style={{ color: statusColor }}>
              {Math.round(currentSpo2)}%
            </div>
          </div>
          <div>
            <div className={`
              inline-block px-3 py-1 rounded text-xs font-bold 
              ${statusText === 'Normal' ? 'bg-emerald-900/40 text-emerald-300' : 
                statusText === 'Warning' ? 'bg-yellow-900/40 text-yellow-300' :
                'bg-red-900/40 text-red-300'}
            `}>
              {statusText}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* Footer - Average and range info */}
      <div className="px-4 py-2 border-t border-slate-800/50 flex justify-between text-xs text-slate-400 font-mono">
        <span>Average: <span className="text-blue-300">{Math.round(average)}%</span></span>
        <span>Range: <span className="text-blue-300">95-100%</span></span>
        <span>Min Acceptable: <span className="text-yellow-300">90%</span></span>
      </div>
    </div>
  );
}

/**
 * Draw color-coded zones for SpO2 levels.
 */
function drawZones(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  // Normal zone (95-100%) - Green
  const normalHeight = (height * 5) / 10;
  ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
  ctx.fillRect(0, 0, width, normalHeight);

  // Warning zone (90-94%) - Yellow/Orange
  const warningHeight = (height * 4) / 10;
  ctx.fillStyle = 'rgba(255, 170, 0, 0.05)';
  ctx.fillRect(0, normalHeight, width, warningHeight);

  // Critical zone (< 90%) - Red
  ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
  ctx.fillRect(0, normalHeight + warningHeight, width, height - normalHeight - warningHeight);
}

/**
 * Draw SpO2 grid lines.
 */
function drawSpO2Grid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.strokeStyle = '#1a3a4a';
  ctx.lineWidth = 1;

  // Horizontal lines for percentage levels
  const percentLines = [90, 92, 94, 96, 98, 100];
  const normalHeight = (height * 5) / 10;

  for (const percent of percentLines) {
    const y = height - ((percent - 85) / 15) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#4a7a8a';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${percent}%`, width - 5, y - 2);
  }

  // Vertical time markers
  const timeStep = width / 6; // 6 markers
  for (let i = 0; i <= 6; i++) {
    const x = i * timeStep;
    ctx.beginPath();
    ctx.moveTo(x, height - 20);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

/**
 * Draw SpO2 waveform on canvas.
 */
function drawSpO2Waveform(
  ctx: CanvasRenderingContext2D,
  values: number[],
  width: number,
  height: number
) {
  if (values.length === 0) return;

  const safeValues = values.map((value) => (Number.isFinite(value) ? value : 95));

  // SpO2 range is typically 85-100%
  const minRange = 85;
  const maxRange = 115;

  // Line styling
  ctx.strokeStyle = '#00ccff';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const xStep = width / (safeValues.length - 1 || 1);

  ctx.beginPath();
  for (let i = 0; i < safeValues.length; i++) {
    // Normalize value to canvas height (inverted for positive Y-down canvas)
    const normalizedValue = (safeValues[i] - minRange) / (maxRange - minRange);
    const y = height - Math.max(0, Math.min(1, normalizedValue)) * height;
    const x = i * xStep;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Add glow effect
  ctx.strokeStyle = 'rgba(0, 204, 255, 0.3)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    const normalizedValue = (values[i] - minRange) / (maxRange - minRange);
    const y = height - Math.max(0, Math.min(1, normalizedValue)) * height;
    const x = i * xStep;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Draw points for each value
  ctx.fillStyle = '#00ccff';
  for (let i = 0; i < values.length; i++) {
    const normalizedValue = (values[i] - minRange) / (maxRange - minRange);
    const y = height - Math.max(0, Math.min(1, normalizedValue)) * height;
    const x = i * xStep;

    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Simplified progress bar style SpO2 display (alternative).
 * Good for compact layouts.
 */
export function SpO2ProgressBar({ value, average }: { value: number; average: number }) {
  // Determine color
  let barColor: string;
  if (value < 90) {
    barColor = '#ff0000'; // Red
  } else if (value < 95) {
    barColor = '#ffaa00'; // Orange
  } else {
    barColor = '#00ff00'; // Green
  }

  const percentage = Math.min(100, Math.max(0, ((value - 85) / 15) * 100));

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-mono text-slate-300">SpO2</span>
        <span className="text-2xl font-bold font-mono" style={{ color: barColor }}>
          {Math.round(value)}%
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
        <div
          className="h-full transition-all duration-300 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 20px ${barColor}`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>Avg: {Math.round(average)}%</span>
        <span>Normal: 95-100%</span>
      </div>
    </div>
  );
}
