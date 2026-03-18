'use client';

import React from 'react';
import { Bot, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { AIAnalysis } from '@/types/patient';

interface AIAnalysisCardProps {
  analysis: AIAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
}

export default function AIAnalysisCard({ analysis, loading, onAnalyze }: AIAnalysisCardProps) {
  return (
    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
          <Bot className="text-emerald-500" />
          AI Clinical Analysis
        </h3>
        <button
          onClick={onAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20 transition-all disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={12} /> : null}
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>

      {!analysis && !loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2 border-2 border-dashed border-slate-700/50 rounded-xl">
          <Bot size={40} className="opacity-20" />
          <p className="text-sm">Click refresh to generate AI observation</p>
        </div>
      ) : (
        <div className={`space-y-4 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
            <div className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
              <RefreshCw size={10} /> Clinical Observation
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              {analysis?.observation || "Gathering real-time cardiac insights..."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/20">
              <div className="text-orange-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <AlertCircle size={10} /> Risk Factor
              </div>
              <p className="text-slate-300 text-xs mt-1">
                {analysis?.risk_factor || "Analyzing potential hazards..."}
              </p>
            </div>

            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
              <div className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <Lightbulb size={10} /> Recommendation
              </div>
              <p className="text-slate-300 text-xs mt-1">
                {analysis?.recommendation || "Developing personalized care plan..."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-2">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
               <div 
                className={`h-full transition-all duration-1000 ${
                  analysis?.risk_level === 'high' ? 'bg-red-500' : 
                  analysis?.risk_level === 'moderate' ? 'bg-orange-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(analysis?.risk_score || 0) * 10}%` }}
               />
            </div>
            <span className={`text-[10px] font-bold uppercase ${
              analysis?.risk_level === 'high' ? 'text-red-500' : 
              analysis?.risk_level === 'moderate' ? 'text-orange-500' : 'text-emerald-500'
            }`}>
              {analysis?.risk_level || 'Calculating'} Risk
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
