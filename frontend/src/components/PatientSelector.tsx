'use client';

import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { PatientBrief } from '@/types/patient';

interface PatientSelectorProps {
  patients: PatientBrief[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export default function PatientSelector({ patients, selectedId, onSelect }: PatientSelectorProps) {
  const selected = patients.find(p => p.id === selectedId);

  return (
    <div className="relative group">
      <div className="flex items-center gap-3 bg-slate-800/60 pl-4 pr-1 py-1 rounded-full border border-slate-700/50 hover:border-emerald-500/50 transition-all cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
          <User size={18} />
        </div>
        <div className="flex flex-col pr-4">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Current Patient</span>
          <span className="text-sm text-white font-semibold truncate max-w-[150px]">
            {selected?.label || 'Select Patient'}
          </span>
        </div>
        <div className="p-2 text-slate-500">
          <ChevronDown size={16} />
        </div>
        
        <select
          value={selectedId}
          onChange={(e) => onSelect(parseInt(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
