/**
 * Blood pressure display with systolic/diastolic/mean format.
 */

'use client';

import React from 'react';

interface BPDisplayProps {
  systolic: number;
  diastolic: number;
  status?: 'normal' | 'warning' | 'critical';
}

function calculateMeanBP(systolic: number, diastolic: number) {
  return Math.round(diastolic + (systolic - diastolic) / 3);
}

export function BPDisplay({ systolic, diastolic, status = 'normal' }: BPDisplayProps) {
  const mean = calculateMeanBP(systolic, diastolic);
  const colors = {
    normal: 'text-cyan-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400">mmHg</span>
      <span className={`text-3xl font-mono font-bold ${colors[status]}`}>
        {systolic}/{diastolic}
      </span>
      <span className={`text-xl font-mono ${colors[status]}`}>
        ({mean})
      </span>
    </div>
  );
}
