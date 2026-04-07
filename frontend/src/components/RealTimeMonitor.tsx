/**
 * Main container for real-time cardiac monitoring.
 * Combines ECG and SpO2 displays with controls and patient selection.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { ECGGraph } from '@/components/ECGGraph';
import { SpO2Graph } from '@/components/SpO2Graph';
import { VitalDisplay, HeartRateDisplay, SpO2Display } from '@/components/VitalDisplay';
import { ControlPanel } from '@/components/ControlPanel';
import { MultiLeadECG } from '@/components/MultiLeadECG';
import { BPDisplay } from '@/components/BPDisplay';
import { useSignalStreaming } from '@/hooks/useSignalStreaming';
import { useAudioBeep } from '@/hooks/useAudioBeep';
import { Patient, PatientBrief } from '@/types/patient';
import { VitalSigns } from '@/types/signals';

interface RealTimeMonitorProps {
  patientId: number;
  patients: PatientBrief[];
  patient?: Patient | null;
  onPatientChange?: (patientId: number) => void;
}

/**
 * Real-time monitor component displaying ECG and SpO2 waveforms.
 */
export function RealTimeMonitor({
  patientId,
  patients,
  patient,
  onPatientChange,
}: RealTimeMonitorProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(patientId);

  const defaultVitals = useMemo<VitalSigns>(
    () => ({
      systolic_bp: patient?.systolic_bp ?? 120,
      diastolic_bp: patient?.diastolic_bp ?? 80,
      heart_rate: patient?.heart_rate ?? 75,
      spo2: 98,
      temperature: 37.0,
      respiratory_rate: 16,
    }),
    [patient]
  );

  const [manualVitals, setManualVitals] = useState<VitalSigns>(defaultVitals);
  const [debouncedVitals, setDebouncedVitals] = useState<VitalSigns>(defaultVitals);

  const requestKey = useMemo(() => JSON.stringify(debouncedVitals), [debouncedVitals]);

  // Handle patient selection
  const handlePatientSelect = (newPatientId: number) => {
    setSelectedPatient(newPatientId);
    onPatientChange?.(newPatientId);
  };

  useEffect(() => {
    setSelectedPatient(patientId);
  }, [patientId]);

  useEffect(() => {
    setManualVitals(defaultVitals);
    setDebouncedVitals(defaultVitals);
  }, [defaultVitals]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedVitals(manualVitals);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [manualVitals]);

  // Use streaming hook to get signal data and animation state
  const streamingState = useSignalStreaming(
    selectedPatient,
    isPlaying,
    5,
    60,
    {
      mode: 'manual',
      vitals: debouncedVitals,
      requestKey,
    }
  );

  const { playBeep } = useAudioBeep(isPlaying && audioEnabled, {
    frequency: 1000,
    frequencyEnd: 700,
    duration: 80,
    volume: 0.35,
    waveform: 'sine',
    click: true,
  });

  useEffect(() => {
    if (!isPlaying || !audioEnabled) return undefined;
    if (manualVitals.heart_rate <= 0) return undefined;

    const intervalMs = 60000 / manualVitals.heart_rate;
    const intervalId = window.setInterval(() => {
      playBeep();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [isPlaying, audioEnabled, manualVitals.heart_rate, playBeep]);

  // Get current patient info
  const currentPatient = patients.find((p) => p.id === selectedPatient);
  const patientName = currentPatient ? `${currentPatient.age}y ${currentPatient.sex}` : 'Unknown';

  const bpStatus: 'normal' | 'warning' | 'critical' =
    manualVitals.systolic_bp < 80 || manualVitals.systolic_bp > 160
      ? 'critical'
      : manualVitals.systolic_bp < 90 || manualVitals.systolic_bp > 140
      ? 'warning'
      : 'normal';

  const tempStatus: 'normal' | 'warning' | 'critical' =
    manualVitals.temperature < 35.5 || manualVitals.temperature > 39.0
      ? 'critical'
      : manualVitals.temperature < 36.1 || manualVitals.temperature > 38.0
      ? 'warning'
      : 'normal';

  const respStatus: 'normal' | 'warning' | 'critical' =
    manualVitals.respiratory_rate < 8 || manualVitals.respiratory_rate > 30
      ? 'critical'
      : manualVitals.respiratory_rate < 10 || manualVitals.respiratory_rate > 24
      ? 'warning'
      : 'normal';

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Cardiac Monitor</h1>
            <p className="text-sm text-slate-400">Real-time ECG & SpO2 Monitoring</p>
          </div>

          {/* Alert banner removed per request */}
        </div>

        {/* Controls and info */}
        <div className="flex items-center justify-between">
          {/* Patient selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">Patient:</label>
            <select
              value={selectedPatient}
              onChange={(e) => handlePatientSelect(parseInt(e.target.value))}
              className="
                bg-slate-900 text-slate-100 px-3 py-2 rounded border border-slate-700
                hover:border-emerald-500/50 transition-colors text-sm font-mono
              "
            >
              {patients.map((patientOption) => (
                <option key={patientOption.id} value={patientOption.id}>
                  Patient {patientOption.id} - {patientOption.age}y {patientOption.sex}
                </option>
              ))}
            </select>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="
                p-2 rounded hover:bg-slate-800 transition-colors
                text-emerald-400 hover:text-emerald-300
              "
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
              }}
              className="
                p-2 rounded hover:bg-slate-800 transition-colors
                text-slate-400 hover:text-slate-300
              "
              title="Reset"
              disabled
            >
              <RotateCcw size={20} />
            </button>

            <div className="w-px h-6 bg-slate-700/30" />

            {/* Audio toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`
                p-2 rounded transition-colors
                ${
                  audioEnabled
                    ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-300'
                }
              `}
              title={audioEnabled ? 'Audio on' : 'Audio off'}
            >
              {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>

          {/* Status indicator */}
          <div className="text-right text-xs text-slate-400 font-mono">
            {streamingState.isLoading ? (
              <span className="text-yellow-400">Loading...</span>
            ) : streamingState.error ? (
              <span className="text-red-400">Error: {streamingState.error}</span>
            ) : (
              <span className="text-emerald-400">Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            {/* Multi-lead display */}
            {streamingState.leadWindows && (
              <div className="bg-black rounded-lg border border-slate-800/50 shadow-lg shadow-slate-900/50 p-3">
                <MultiLeadECG leadWindows={streamingState.leadWindows} />
              </div>
            )}

            {/* Vital signs row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <HeartRateDisplay
                value={manualVitals.heart_rate}
                status={
                  manualVitals.heart_rate < 60 || manualVitals.heart_rate > 100
                    ? 'warning'
                    : 'normal'
                }
              />

              <SpO2Display
                value={manualVitals.spo2}
                average={
                  streamingState.spo2Window.values.length > 0
                    ? Math.round(
                        streamingState.spo2Window.values.reduce((a, b) => a + b, 0) /
                          streamingState.spo2Window.values.length
                      )
                    : manualVitals.spo2
                }
              />

              <VitalDisplay
                label="Signal Quality"
                value={streamingState.ecgWindow.values.length > 0 ? 95 : 0}
                unit="%"
                status={streamingState.ecgWindow.values.length > 50 ? 'normal' : 'warning'}
              />
            </div>

            {/* Secondary vitals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-slate-800/50 bg-slate-950/70 p-4">
                <div className="text-xs text-slate-400 mb-2">Blood Pressure</div>
                <BPDisplay
                  systolic={manualVitals.systolic_bp}
                  diastolic={manualVitals.diastolic_bp}
                  status={bpStatus}
                />
              </div>

              <VitalDisplay
                label="Temperature"
                value={manualVitals.temperature}
                unit="C"
                status={tempStatus}
              />

              <VitalDisplay
                label="Respiratory Rate"
                value={manualVitals.respiratory_rate}
                unit="rpm"
                status={respStatus}
              />
            </div>

            {/* SpO2 Graph */}
            <div className="h-80 bg-slate-950 rounded-lg border border-slate-800/50 shadow-lg shadow-slate-900/50 overflow-hidden">
              {streamingState.isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-slate-400 font-mono">Loading SpO2 data...</div>
                </div>
              ) : (
                <SpO2Graph
                  window={streamingState.spo2Window}
                  average={
                    streamingState.spo2Window.values.length > 0
                      ? Math.round(
                          streamingState.spo2Window.values.reduce((a, b) => a + b, 0) /
                            streamingState.spo2Window.values.length
                        )
                      : manualVitals.spo2
                  }
                  samplingRate={1}
                />
              )}
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <ControlPanel
              initialValues={manualVitals}
              onUpdate={setManualVitals}
            />

            <div className="rounded-lg border border-slate-800/50 bg-slate-950/70 p-4">
              <div className="text-xs text-slate-400 mb-3">Patient Summary</div>
              <div className="text-sm text-slate-200 font-mono">{patientName}</div>
              <div className="text-xs text-slate-500 mt-1">ID: {selectedPatient}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
