/**
 * Hook for managing real-time signal data streaming and animation state.
 * Handles fetching signals from the backend and managing playback.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalResponse, SignalWindow, StreamingState, VitalSigns } from '@/types/signals';
import { calculateHeartRateFromPeaks, detectRPeaks, calculateAlerts, findWindowIndices } from '@/lib/signalProcessor';
import { api } from '@/lib/api';

/**
 * Hook for streaming and displaying real-time cardiac signals.
 *
 * @param patientId - The patient ID to fetch signals for
 * @param isPlaying - Whether animation is currently playing
 * @param ecgWindowSeconds - Size of visible ECG window in seconds (default: 5)
 * @param spo2WindowSeconds - Size of visible SpO2 window in seconds (default: 60)
 * @returns Streaming state with current windows and detected metrics
 */
export function useSignalStreaming(
  patientId: number,
  isPlaying: boolean,
  ecgWindowSeconds: number = 5,
  spo2WindowSeconds: number = 60,
  options?: {
    mode?: 'patient' | 'manual';
    vitals?: VitalSigns;
    requestKey?: string;
  }
): StreamingState {
  const [state, setState] = useState<StreamingState>({
    ecgWindow: {
      timestamps: [],
      values: [],
      startTime: 0,
      endTime: ecgWindowSeconds,
      isPaused: !isPlaying,
    },
    spo2Window: {
      timestamps: [],
      values: [],
      startTime: 0,
      endTime: spo2WindowSeconds,
      isPaused: !isPlaying,
    },
    detectedHeartRate: 0,
    alerts: {
      heart_rate_alerts: [],
      spo2_alerts: [],
      overall_severity: 'normal',
    },
    isPlaying: isPlaying,
    isLoading: true,
    error: null,
  });

  // Keep references to signal data and animation state
  const signalDataRef = useRef<SignalResponse | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const ecgPlayheadRef = useRef(0);
  const spo2PlayheadRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  
  useEffect(() => {
    lastFrameTimeRef.current = Date.now();
  }, []);

  // Fetch signal data from backend
  const fetchSignals = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      // Fetch signals from backend
      const mode = options?.mode ?? 'patient';
      const data =
        mode === 'manual' && options?.vitals
          ? await api.generateSignals(options.vitals)
          : await api.getSignals(patientId);
      signalDataRef.current = data;

      // Initialize playheads
      ecgPlayheadRef.current = 0;
      spo2PlayheadRef.current = 0;

      // Update state with initial window
      const initialECGWindow = createSignalWindow(
        data.ecg.timestamps,
        data.ecg.values,
        0,
        ecgWindowSeconds
      );
      const initialSpo2Window = createSignalWindow(
        data.spo2.timestamps,
        data.spo2.values,
        0,
        spo2WindowSeconds
      );

      // Calculate initial heart rate from ECG
      const rPeaks = detectRPeaks(data.ecg.values, data.ecg.sampling_rate);
      const hrInfo = calculateHeartRateFromPeaks(
        rPeaks,
        data.ecg.sampling_rate
      );

      const leadWindows = data.leads
        ? {
            lead_i: createSignalWindow(
              data.leads.lead_i.timestamps,
              data.leads.lead_i.values,
              0,
              ecgWindowSeconds
            ),
            lead_ii: createSignalWindow(
              data.leads.lead_ii.timestamps,
              data.leads.lead_ii.values,
              0,
              ecgWindowSeconds
            ),
            lead_iii: createSignalWindow(
              data.leads.lead_iii.timestamps,
              data.leads.lead_iii.values,
              0,
              ecgWindowSeconds
            ),
          }
        : undefined;

      setState((prev) => ({
        ...prev,
        ecgWindow: initialECGWindow,
        spo2Window: initialSpo2Window,
        detectedHeartRate: hrInfo.heart_rate,
        alerts: data.alerts,
        leadWindows,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('Error fetching signals:', error);
    }
  }, [patientId, ecgWindowSeconds, spo2WindowSeconds, options?.mode, options?.requestKey]);

  // Animation loop for continuous scrolling
  const animate = useCallback(() => {
    if (!signalDataRef.current || !isPlaying) {
      return;
    }

    const now = Date.now();
    const deltaTime = (now - lastFrameTimeRef.current) / 1000; // Convert to seconds
    lastFrameTimeRef.current = now;

    // Advance playheads based on elapsed time
    // For realistic simulation, advance by actual signal time
    ecgPlayheadRef.current += deltaTime;
    spo2PlayheadRef.current += deltaTime;

    const ecgData = signalDataRef.current.ecg;
    const spo2Data = signalDataRef.current.spo2;

    // Loop when reaching end
    if (ecgPlayheadRef.current > ecgData.timestamps[ecgData.timestamps.length - 1]) {
      ecgPlayheadRef.current = 0;
    }
    if (spo2PlayheadRef.current > spo2Data.timestamps[spo2Data.timestamps.length - 1]) {
      spo2PlayheadRef.current = 0;
    }

    // Create new windows based on playhead position
    const newECGWindow = createSignalWindow(
      ecgData.timestamps,
      ecgData.values,
      ecgPlayheadRef.current,
      ecgPlayheadRef.current + ecgWindowSeconds
    );

    const newSpo2Window = createSignalWindow(
      spo2Data.timestamps,
      spo2Data.values,
      spo2PlayheadRef.current,
      spo2PlayheadRef.current + spo2WindowSeconds
    );

    // Recalculate heart rate from visible ECG window
    const rPeaks = detectRPeaks(newECGWindow.values, ecgData.sampling_rate);
    const hrInfo = calculateHeartRateFromPeaks(rPeaks, ecgData.sampling_rate);

    // Get current SpO2 for alerts
    const currentSpo2 = newSpo2Window.values[0] || 98;

    const newLeadWindows = signalDataRef.current.leads
      ? {
          lead_i: createSignalWindow(
            signalDataRef.current.leads.lead_i.timestamps,
            signalDataRef.current.leads.lead_i.values,
            ecgPlayheadRef.current,
            ecgPlayheadRef.current + ecgWindowSeconds
          ),
          lead_ii: createSignalWindow(
            signalDataRef.current.leads.lead_ii.timestamps,
            signalDataRef.current.leads.lead_ii.values,
            ecgPlayheadRef.current,
            ecgPlayheadRef.current + ecgWindowSeconds
          ),
          lead_iii: createSignalWindow(
            signalDataRef.current.leads.lead_iii.timestamps,
            signalDataRef.current.leads.lead_iii.values,
            ecgPlayheadRef.current,
            ecgPlayheadRef.current + ecgWindowSeconds
          ),
        }
      : undefined;

    setState((prev) => ({
      ...prev,
      ecgWindow: newECGWindow,
      spo2Window: newSpo2Window,
      detectedHeartRate: hrInfo.heart_rate || ecgData.heart_rate,
      alerts: calculateAlerts(
        hrInfo.heart_rate || ecgData.heart_rate,
        currentSpo2
      ),
      leadWindows: newLeadWindows,
      isPlaying: isPlaying,
    }));

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, ecgWindowSeconds, spo2WindowSeconds]);

  // Fetch signals on mount and when patient changes
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // Manage animation loop
  useEffect(() => {
    if (isPlaying && signalDataRef.current) {
      lastFrameTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  return state;
}

/**
 * Create a window of signal data for a specific time range.
 *
 * @param timestamps - Full array of timestamps
 * @param values - Full array of signal values
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @returns Signal window object
 */
function createSignalWindow(
  timestamps: number[],
  values: number[],
  startTime: number,
  endTime: number
): SignalWindow {
  const { startIdx, endIdx } = findWindowIndices(timestamps, startTime, endTime);

  return {
    timestamps: timestamps.slice(startIdx, endIdx + 1),
    values: values.slice(startIdx, endIdx + 1),
    startTime,
    endTime,
    isPaused: false,
  };
}
