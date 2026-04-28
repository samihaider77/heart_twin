'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Patient, PatientBrief, AIAnalysis } from '@/types/patient';
import HeartViewer3D from '@/components/HeartViewer3D';
import ParameterPanel from '@/components/ParameterPanel';
import ControlSliders from '@/components/ControlSliders';
import AIAnalysisCard from '@/components/AIAnalysisCard';
import PatientSelector from '@/components/PatientSelector';
import { Activity, Heart, Monitor } from 'lucide-react';
import { useSignalStreaming } from '@/hooks/useSignalStreaming';

function MiniMonitor({ patientId }: { patientId: number }) {
  const streamingState = useSignalStreaming(patientId, true, 3, 30);
  const values = streamingState.ecgWindow.values;
  if (!values.length) return <div className="h-full w-full bg-slate-900 animate-pulse"></div>;
  
  // Render a simple SVG sparkline for the mini monitor
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.slice(-100).map((v, i, arr) => `${(i / Math.max(1, arr.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(' ');
  
  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Dashboard() {
  const [patients, setPatients] = useState<PatientBrief[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const handlePatientSelect = useCallback(async (id: number) => {
    const patientData = await api.getPatient(id);
    setCurrentPatient(patientData);
    setAnalysis(null); // Reset analysis for new patient
  }, []);

  const initializeDashboard = useCallback(async () => {
    try {
      setIsInitializing(true);
      setInitError(null);

      const patientList = await api.getPatients();
      setPatients(patientList);

      if (patientList.length === 0) {
        setCurrentPatient(null);
        setInitError('No patients available');
        return;
      }

      await handlePatientSelect(patientList[0].id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize dashboard';
      setCurrentPatient(null);
      setInitError(message);
      console.error('Failed to initialize dashboard', err);
    } finally {
      setIsInitializing(false);
    }
  }, [handlePatientSelect]);

  // Fetch initial data
  useEffect(() => {
    void initializeDashboard();
  }, [initializeDashboard]);

  const handleVitalsChange = useCallback(async (updates: Partial<Patient>) => {
    if (!currentPatient) return;
    try {
      const updated = await api.updateVitals(currentPatient.id, updates);
      setCurrentPatient(updated);
    } catch (err) {
      console.error("Failed to update vitals", err);
    }
  }, [currentPatient]);

  const handleRunAnalysis = async () => {
    if (!currentPatient) return;
    setLoadingAnalysis(true);
    try {
      const res = await api.getAIAnalysis({
        systolic_bp: currentPatient.systolic_bp,
        diastolic_bp: currentPatient.diastolic_bp,
        heart_rate: currentPatient.heart_rate,
        ejection_fraction: currentPatient.ejection_fraction,
        st_depression: currentPatient.st_depression,
        cholesterol: currentPatient.cholesterol,
      });
      setAnalysis(res);
    } catch (err) {
      console.error("AI Analysis failed", err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  if (isInitializing) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Heart className="text-emerald-500 animate-pulse" size={48} />
        <span className="text-slate-400 font-medium">Initializing Digital Twin...</span>
      </div>
    </div>
  );

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-500/30 bg-slate-900/60 p-6 text-center">
          <h2 className="text-xl font-bold text-red-300">Unable to load dashboard</h2>
          <p className="mt-3 text-slate-300">{initError}</p>
          <button
            type="button"
            onClick={() => {
              void initializeDashboard();
            }}
            className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentPatient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Heart className="text-emerald-500" size={48} />
          <span className="text-slate-300 font-medium">No patient loaded</span>
          <button
            type="button"
            onClick={() => {
              void initializeDashboard();
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Activity className="text-emerald-500" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Cardiac Digital Twin <span className="text-emerald-500">v2.0</span></h1>
              <p className="text-slate-400 text-sm font-medium">Real-time physiological simulation & AI diagnostics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/monitor" 
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30
                text-emerald-400 hover:text-emerald-300 transition-all
                font-medium text-sm overflow-hidden relative group
              "
              title="Open real-time cardiac monitor"
            >
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Monitor size={18} className="z-10" />
              <span className="z-10">Monitor</span>
              <div className="ml-2 w-24 h-8 opacity-70 flex items-center justify-center -mr-2 bg-black/40 rounded overflow-hidden">
                <MiniMonitor patientId={currentPatient.id} />
              </div>
            </Link>
            <PatientSelector 
              patients={patients} 
              selectedId={currentPatient.id} 
              onSelect={(id) => {
                handlePatientSelect(id).catch((err) => {
                  console.error('Failed to fetch patient details', err);
                });
              }} 
            />
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column: 3D Visualization & Controls */}
          <div className="xl:col-span-8 space-y-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <HeartViewer3D 
                systolicBp={currentPatient.systolic_bp}
                diastolicBp={currentPatient.diastolic_bp}
                heartRate={currentPatient.heart_rate}
                ejectionFraction={currentPatient.ejection_fraction}
                riskScore={analysis?.risk_score || 0}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <ControlSliders 
                systolic={currentPatient.systolic_bp}
                setSystolic={(val: number) => handleVitalsChange({ systolic_bp: val })}
                diastolic={currentPatient.diastolic_bp}
                setDiastolic={(val: number) => handleVitalsChange({ diastolic_bp: val })}
                heartRate={currentPatient.heart_rate}
                setHeartRate={(val: number) => handleVitalsChange({ heart_rate: val })}
                cholesterol={currentPatient.cholesterol}
                setCholesterol={(val: number) => handleVitalsChange({ cholesterol: val })}
              />
              <AIAnalysisCard 
                analysis={analysis}
                loading={loadingAnalysis}
                onAnalyze={handleRunAnalysis}
              />
            </div>
          </div>

          {/* Right Column: Vitals Panel */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
               <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
                <Heart className="text-emerald-500" size={20} />
                Physiological Metrics
              </h3>
              <ParameterPanel patient={currentPatient} />
            </div>

            <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10">
              <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-2">System Status</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Digital twin synchronized with UCI clinical dataset. Derived metrics (EF, CO, SV) are simulated based on cardiovascular modeling parameters.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
