/**
 * Multi-lead ECG display with three stacked lead strips.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { SignalWindow } from '@/types/signals';

interface LeadStripProps {
  label: string;
  window: SignalWindow;
}

function LeadStrip({ label, window }: LeadStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || window.values.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height);
    drawWaveform(ctx, window.values, width, height);
  }, [window]);

  return (
    <div className="relative h-20 w-full bg-black border border-slate-800/50 rounded">
      <div className="absolute top-1 left-2 text-xs font-mono text-green-400">{label}</div>
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
    </div>
  );
}

interface MultiLeadECGProps {
  leadWindows: {
    lead_i: SignalWindow;
    lead_ii: SignalWindow;
    lead_iii: SignalWindow;
  };
}

export function MultiLeadECG({ leadWindows }: MultiLeadECGProps) {
  return (
    <div className="space-y-2">
      <LeadStrip label="Lead I" window={leadWindows.lead_i} />
      <LeadStrip label="Lead II" window={leadWindows.lead_ii} />
      <LeadStrip label="Lead III" window={leadWindows.lead_iii} />
    </div>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gridSpacing = 20;
  const subGridFactor = 5;

  ctx.strokeStyle = '#003300';
  ctx.lineWidth = 1;

  for (let x = 0; x < width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const minorSpacing = gridSpacing / subGridFactor;
  ctx.strokeStyle = '#001100';
  ctx.lineWidth = 0.5;

  for (let x = 0; x < width; x += minorSpacing) {
    if (x % gridSpacing !== 0) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  for (let y = 0; y < height; y += minorSpacing) {
    if (y % gridSpacing !== 0) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
}

function drawWaveform(ctx: CanvasRenderingContext2D, values: number[], width: number, height: number) {
  if (!values.length) return;

  // Use a fixed ECG amplitude scale to avoid stretching per window.
  const min = -1.2;
  const max = 1.2;
  const range = max - min;

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const xStep = width / (values.length - 1 || 1);

  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    const clampedValue = Math.max(min, Math.min(max, values[i]));
    const normalizedValue = (clampedValue - min) / range;
    const y = height - normalizedValue * height * 0.8 - height * 0.1;
    const x = i * xStep;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}
