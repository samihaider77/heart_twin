/**
 * Component for displaying ECG waveform with horizontal scrolling animation.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { SignalWindow } from '@/types/signals';

interface ECGGraphProps {
  window: SignalWindow;
  heartRate: number;
  samplingRate?: number;
}

/**
 * ECG waveform display with scrolling animation.
 * Renders a hospital-style ECG monitor with green line on black background.
 *
 * @param window - Current visible signal window
 * @param heartRate - Current detected/displayed heart rate
 * @param samplingRate - ECG sampling rate (default: 250)
 */
export function ECGGraph({
  window,
  heartRate,
  samplingRate = 250,
}: ECGGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render ECG using HTML5 Canvas for performance
  useEffect(() => {
    if (!canvasRef.current || window.values.length === 0) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Resize canvas if needed
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Clear canvas with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw ECG waveform
    drawWaveform(ctx, window.values, width, height);

  }, [window]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-black rounded-lg border border-slate-800/50 overflow-hidden"
    >
      {/* Header with title and HR */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800/50">
        <span className="text-green-500 font-mono text-sm font-bold tracking-wider">
          ECG (Lead II)
        </span>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-green-500 font-mono text-xs text-slate-400">
              Heart Rate
            </div>
            <div className="text-green-500 font-mono text-2xl font-bold">
              {Math.round(heartRate)}
            </div>
          </div>
          <span className="text-green-500 font-mono text-sm">bpm</span>
        </div>
      </div>

      {/* Canvas for waveform */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
}

/**
 * Draw grid lines on ECG background (standard medical ECG paper style).
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const gridSpacingX = 20; // pixels between major grid lines
  const gridSpacingY = 20;
  const subGridFactor = 5; // 4 minor lines between major lines

  // Major grid color (dark green)
  ctx.strokeStyle = '#003300';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x < width; x += gridSpacingX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y < height; y += gridSpacingY) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Minor grid (lighter, thinner)
  const minorSpacingX = gridSpacingX / subGridFactor;
  const minorSpacingY = gridSpacingY / subGridFactor;

  ctx.strokeStyle = '#001100';
  ctx.lineWidth = 0.5;

  // Vertical minor grid
  for (let x = 0; x < width; x += minorSpacingX) {
    if (x % gridSpacingX !== 0) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  // Horizontal minor grid
  for (let y = 0; y < height; y += minorSpacingY) {
    if (y % gridSpacingY !== 0) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
}

/**
 * Draw ECG waveform on canvas.
 */
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  values: number[],
  width: number,
  height: number
) {
  if (values.length === 0) return;

  // Find min/max for scaling
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // ECG line styling
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Calculate x spacing
  const xStep = width / (values.length - 1);

  // Draw waveform
  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    // Normalize value to canvas height
    const normalizedValue = (values[i] - min) / range;
    const y = height - normalizedValue * height * 0.8 - height * 0.1;
    const x = i * xStep;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Add glow effect for realism
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i < values.length; i++) {
    const normalizedValue = (values[i] - min) / range;
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

/**
 * Alternative Plotly-based ECG graph component (requires npm install plotly.js-dist-min).
 * Can be used instead of canvas-based version for better interactivity.
 */
export const ECGGraphPlotly = React.lazy(async () => {
  const Plotly = (await import('plotly.js-dist-min')).default;
  
  return {
    default: function ECGGraphPlotlyComponent({ window, heartRate }: ECGGraphProps) {
      const plotRef = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        if (!plotRef.current || window.values.length === 0) return;

        const layout: any = {
          title: {
            text: `ECG (Lead II) - HR: ${Math.round(heartRate)} bpm`,
            font: { color: '#00ff00', family: 'Courier New' },
          },
          paper_bgcolor: '#000000',
          plot_bgcolor: '#000000',
          xaxis: {
            showgrid: true,
            gridcolor: '#003300',
            showticklabels: false,
            range: [window.startTime, window.endTime],
            zeroline: false,
          },
          yaxis: {
            showgrid: true,
            gridcolor: '#003300',
            zeroline: false,
            autorange: true,
            fixedrange: false,
            title: { text: 'mV', font: { color: '#00ff00' } },
          },
          margin: { l: 50, r: 20, t: 50, b: 30 },
          showlegend: false,
          hovermode: 'x',
        };

        const data: any[] = [
          {
            x: window.timestamps,
            y: window.values,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#00ff00', width: 2 },
            hoverinfo: 'y+x',
          },
        ];

        Plotly.newPlot(plotRef.current, data, layout, {
          displayModeBar: false,
          responsive: true,
        });

        const currentRef = plotRef.current;
        return () => {
          if (currentRef) {
            Plotly.purge(currentRef);
          }
        };
      }, [window.timestamps, window.values, window.startTime, window.endTime, heartRate]);

      return (
        <div
          ref={plotRef}
          className="w-full h-64 bg-black rounded-lg border border-slate-800/50"
        />
      );
    },
  };
});

// (ECGGraphPlotly as any).displayName = 'ECGGraphPlotly';
