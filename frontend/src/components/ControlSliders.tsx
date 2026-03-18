'use client';

import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  unit: string;
}

interface ControlPanelProps {
  systolic: number;
  setSystolic: (val: number) => void;
  diastolic: number;
  setDiastolic: (val: number) => void;
  heartRate: number;
  setHeartRate: (val: number) => void;
  cholesterol: number;
  setCholesterol: (val: number) => void;
}

const Slider = ({ label, value, min, max, onChange, unit }: SliderProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="text-white font-bold">{value} <span className="text-[10px] text-slate-500">{unit}</span></span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
    />
  </div>
);

export default function ControlPanel({ 
  systolic, setSystolic,
  diastolic, setDiastolic,
  heartRate, setHeartRate,
  cholesterol, setCholesterol 
}: ControlPanelProps) {
  return (
    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 space-y-6">
      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
        <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
        Vitals Control
      </h3>
      <Slider label="Systolic BP" value={systolic} min={80} max={200} onChange={setSystolic} unit="mmHg" />
      <Slider label="Diastolic BP" value={diastolic} min={50} max={120} onChange={setDiastolic} unit="mmHg" />
      <Slider label="Heart Rate" value={heartRate} min={40} max={180} onChange={setHeartRate} unit="BPM" />
      <Slider label="Cholesterol" value={cholesterol} min={100} max={400} onChange={setCholesterol} unit="mg/dL" />
    </div>
  );
}
