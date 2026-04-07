/**
 * Manual vital control panel for real-time adjustment.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { VitalSigns } from '@/types/signals';

interface ControlPanelProps {
  initialValues: VitalSigns;
  onUpdate: (vitals: VitalSigns) => void;
  onSave?: (vitals: VitalSigns) => void;
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ControlPanel({ initialValues, onUpdate, onSave }: ControlPanelProps) {
  const [vitals, setVitals] = useState<VitalSigns>(initialValues);

  useEffect(() => {
    setVitals(initialValues);
  }, [initialValues]);

  const handleChange = (key: keyof VitalSigns, value: number) => {
    const updated = {
      ...vitals,
      [key]: value,
    } as VitalSigns;
    setVitals(updated);
    onUpdate(updated);
  };

  const resetToDefaults = () => {
    setVitals(initialValues);
    onUpdate(initialValues);
  };

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-950/80 p-5 shadow-lg shadow-slate-900/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide">Vital Controls</h3>
        <span className="text-xs text-slate-500 font-mono">Manual adjustment</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400">
            Systolic BP: <span className="text-slate-200 font-mono">{vitals.systolic_bp} mmHg</span>
          </label>
          <input
            type="range"
            min={80}
            max={200}
            value={vitals.systolic_bp}
            onChange={(e) => handleChange('systolic_bp', clampValue(Number(e.target.value), 80, 200))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">
            Diastolic BP: <span className="text-slate-200 font-mono">{vitals.diastolic_bp} mmHg</span>
          </label>
          <input
            type="range"
            min={50}
            max={120}
            value={vitals.diastolic_bp}
            onChange={(e) => handleChange('diastolic_bp', clampValue(Number(e.target.value), 50, 120))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">
            Heart Rate: <span className="text-slate-200 font-mono">{vitals.heart_rate} bpm</span>
          </label>
          <input
            type="range"
            min={0}
            max={200}
            value={vitals.heart_rate}
            onChange={(e) => handleChange('heart_rate', clampValue(Number(e.target.value), 0, 200))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">
            SpO2: <span className="text-slate-200 font-mono">{vitals.spo2} %</span>
          </label>
          <input
            type="range"
            min={80}
            max={100}
            value={vitals.spo2}
            onChange={(e) => handleChange('spo2', clampValue(Number(e.target.value), 80, 100))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">
            Temperature: <span className="text-slate-200 font-mono">{vitals.temperature.toFixed(1)} C</span>
          </label>
          <input
            type="range"
            min={35.0}
            max={42.0}
            step={0.1}
            value={vitals.temperature}
            onChange={(e) => handleChange('temperature', clampValue(Number(e.target.value), 35.0, 42.0))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">
            Respiratory Rate: <span className="text-slate-200 font-mono">{vitals.respiratory_rate} rpm</span>
          </label>
          <input
            type="range"
            min={8}
            max={40}
            value={vitals.respiratory_rate}
            onChange={(e) => handleChange('respiratory_rate', clampValue(Number(e.target.value), 8, 40))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={resetToDefaults}
          className="px-3 py-2 rounded-md text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          Reset to Defaults
        </button>
        <button
          onClick={() => onSave?.(vitals)}
          className="px-3 py-2 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
