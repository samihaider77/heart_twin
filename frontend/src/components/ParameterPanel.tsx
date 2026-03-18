'use client';

import React from 'react';
import { Activity, Clock, Droplets, Heart, Zap, type LucideIcon } from 'lucide-react';
import { Patient } from '@/types/patient';

interface ParameterPanelProps {
  patient: Patient;
}

interface ParameterCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  colorClass: string;
  status: string;
}

const ParameterCard = ({ title, value, unit, icon: Icon, colorClass, status }: ParameterCardProps) => (
  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
        <Icon size={16} />
        <span>{title}</span>
      </div>
      <div className={`w-2 h-2 rounded-full ${colorClass}`} />
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-xs text-slate-500 font-medium">{unit}</span>
    </div>
    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
      {status}
    </div>
  </div>
);

export default function ParameterPanel({ patient }: ParameterPanelProps) {
  const getBpColor = (s: number, d: number) => {
    if (s >= 140 || d >= 90) return 'bg-red-500';
    if (s >= 120 || d >= 80) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getHbColor = (hr: number) => {
    if (hr > 100 || hr < 60) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getEfColor = (ef: number) => {
    if (ef < 40) return 'bg-red-500';
    if (ef < 55) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <ParameterCard
        title="Blood Pressure"
        value={`${patient.systolic_bp}/${patient.diastolic_bp}`}
        unit="mmHg"
        icon={Activity}
        colorClass={getBpColor(patient.systolic_bp, patient.diastolic_bp)}
        status={patient.systolic_bp >= 140 ? 'Hypertension S2' : patient.systolic_bp >= 120 ? 'Elevated' : 'Optimal'}
      />
      <ParameterCard
        title="Heart Rate"
        value={patient.heart_rate}
        unit="BPM"
        icon={Clock}
        colorClass={getHbColor(patient.heart_rate)}
        status={patient.heart_rate > 100 ? 'Tachycardia' : patient.heart_rate < 60 ? 'Bradycardia' : 'Normal'}
      />
      <ParameterCard
        title="Cholesterol"
        value={patient.cholesterol}
        unit="mg/dL"
        icon={Droplets}
        colorClass={patient.cholesterol >= 240 ? 'bg-red-500' : patient.cholesterol >= 200 ? 'bg-yellow-500' : 'bg-emerald-500'}
        status={patient.cholesterol >= 240 ? 'High' : patient.cholesterol >= 200 ? 'Borderline' : 'Normal'}
      />
      <ParameterCard
        title="Ejection Fraction"
        value={`${patient.ejection_fraction}%`}
        unit="EF"
        icon={Heart}
        colorClass={getEfColor(patient.ejection_fraction)}
        status={patient.ejection_fraction < 40 ? 'Reduced' : 'Preserved'}
      />
      <ParameterCard
        title="Cardiac Output"
        value={patient.cardiac_output}
        unit="L/min"
        icon={Zap}
        colorClass="bg-emerald-500"
        status="Calculated"
      />
      <ParameterCard
        title="ST Depression"
        value={patient.st_depression}
        unit="mm"
        icon={Activity}
        colorClass={patient.st_depression > 1.5 ? 'bg-red-500' : 'bg-emerald-500'}
        status={patient.st_depression > 1.5 ? 'Ischemia Risk' : 'Normal'}
      />
    </div>
  );
}
