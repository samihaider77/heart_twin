/**
 * Real-time cardiac monitoring dashboard page.
 * Full-screen ECG and SpO2 monitoring interface.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { RealTimeMonitor } from '@/components/RealTimeMonitor';
import { Patient, PatientBrief } from '@/types/patient';
import { api } from '@/lib/api';

export default function MonitorPage() {
  const [patients, setPatients] = useState<PatientBrief[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(1);

  const initializeMonitor = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await api.getPatients();
      setPatients(data);

      if (data.length === 0) {
        setCurrentPatient(null);
        setError('No patients available');
        return;
      }

      setSelectedPatientId(data[0].id);
      const details = await api.getPatient(data[0].id);
      setCurrentPatient(details);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setCurrentPatient(null);
      setError(errorMessage);
      console.error('Error fetching patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch patient list on mount
  useEffect(() => {
    void initializeMonitor();
  }, [initializeMonitor]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-100 mb-2">Loading Monitor</div>
          <div className="text-slate-400 font-mono">Initializing cardiac monitoring...</div>
        </div>
      </div>
    );
  }

  if (error || patients.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-2">Error</div>
          <div className="text-slate-400 mb-4">
            {error || 'No patients available'}
          </div>
          <button
            type="button"
            onClick={() => {
              void initializeMonitor();
            }}
            className="mb-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
          <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
            Back to Dashboard
          </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-slate-950">
      {/* Back button */}
      <Link
        href="/"
        className="
          absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-2
          text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 
          rounded-lg transition-colors font-mono text-sm
        "
        title="Return to dashboard"
      >
        <ChevronLeft size={18} />
        <span>Back</span>
      </Link>

      {/* Main monitor component */}
      <RealTimeMonitor
        patientId={selectedPatientId}
        patients={patients}
        patient={currentPatient}
        onPatientChange={async (id) => {
          setSelectedPatientId(id);
          try {
            const details = await api.getPatient(id);
            setCurrentPatient(details);
          } catch (err) {
            console.error('Error fetching patient details:', err);
          }
        }}
      />
    </div>
  );
}
