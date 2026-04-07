/**
 * Hook for generating synchronized audio beeps at ECG R-peaks.
 * Uses the Web Audio API to create realistic heartbeat sounds.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Configuration for audio beep generation.
 */
interface AudioBeepConfig {
  frequency?: number; // Hz (default: 1000)
  frequencyEnd?: number; // Hz (optional sweep)
  duration?: number; // ms (default: 100)
  volume?: number; // 0-1 (default: 0.3)
  waveform?: 'sine' | 'triangle' | 'square'; // (default: 'sine')
  click?: boolean; // add short click transient
}

/**
 * Hook for generating audio beeps synchronized to ECG R-peaks.
 *
 * @param isEnabled - Whether audio is enabled
 * @param config - Audio configuration options
 * @returns Object with playBeep function and enabled state
 */
export function useAudioBeep(
  isEnabled: boolean = true,
  config: AudioBeepConfig = {}
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);

  const {
    frequency = 1000,
    frequencyEnd,
    duration = 80,
    volume = 0.35,
    waveform = 'sine',
    click = true,
  } = config;

  // Initialize Web Audio API context
  const initAudioContext = useCallback(() => {
    if (isInitializedRef.current) {
      return;
    }

    try {
      // Use window.AudioContext or webkit version for compatibility
      const AudioContextClass =
        (window as any).AudioContext || (window as any).webkitAudioContext;

      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
        isInitializedRef.current = true;
      }
    } catch (error) {
      console.warn('Web Audio API not available:', error);
    }
  }, []);

  // Play a beep sound
  const playBeep = useCallback(() => {
    if (!isEnabled || !audioContextRef.current) {
      return;
    }

    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const durationSeconds = duration / 1000;

      // Create oscillator for tone
      const oscillator = ctx.createOscillator();
      oscillator.type = waveform;
      oscillator.frequency.value = frequency;
      if (frequencyEnd !== undefined) {
        oscillator.frequency.linearRampToValueAtTime(
          frequencyEnd,
          now + durationSeconds
        );
      }

      // Create gain node for envelope
      const gainNode = ctx.createGain();
      const attack = 0.005;
      const release = Math.max(0.03, durationSeconds - attack);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

      // Optional transient click for realism
      let clickOscillator: OscillatorNode | null = null;
      let clickGain: GainNode | null = null;
      if (click) {
        clickOscillator = ctx.createOscillator();
        clickOscillator.type = 'square';
        clickOscillator.frequency.value = 2000;
        clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(volume * 0.4, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        clickOscillator.connect(clickGain);
        clickGain.connect(ctx.destination);
      }

      // Connect nodes and play
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + durationSeconds);

      if (clickOscillator) {
        clickOscillator.start(now);
        clickOscillator.stop(now + 0.02);
      }
    } catch (error) {
      console.warn('Error playing audio beep:', error);
    }
  }, [isEnabled, frequency, frequencyEnd, duration, volume, waveform, click]);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
    }

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [initAudioContext]);

  // Resume audio context if suspended (required by browsers)
  useEffect(() => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().catch((error) => {
        console.warn('Failed to resume audio context:', error);
      });
    }
  }, [isEnabled]);

  return {
    playBeep,
    isEnabled,
    get isAvailable() { return audioContextRef.current !== null; }
  };
}

/**
 * Hook for detecting R-peaks and triggering beeps automatically.
 *
 * @param ecgValues - Current visible ECG values
 * @param ecgTimestamps - Current visible ECG timestamps
 * @param samplingRate - ECG sampling rate in Hz
 * @param isPlaying - Whether animation is playing
 * @param audioConfig - Audio beep configuration
 * @returns Object tracking last detected peak
 */
export function useRPeakBeeps(
  ecgValues: number[],
  ecgTimestamps: number[],
  samplingRate: number = 250,
  isPlaying: boolean = true,
  audioConfig: AudioBeepConfig = {}
) {
  const { playBeep } = useAudioBeep(isPlaying, audioConfig);
  const lastPeakIndexRef = useRef(-1);

  useEffect(() => {
    if (!isPlaying || ecgValues.length < 3) {
      return;
    }

    // Find peaks in current window
    const peaks: number[] = [];
    const minDistance = 100; // Prevent multiple detections (~0.4 sec at 250 Hz)

    for (let i = 1; i < ecgValues.length - 1; i++) {
      if (
        ecgValues[i] > ecgValues[i - 1] &&
        ecgValues[i] > ecgValues[i + 1] &&
        i - lastPeakIndexRef.current >= minDistance
      ) {
        peaks.push(i);
      }
    }

    // Play beep for each new peak
    peaks.forEach((peakIdx) => {
      if (peakIdx > lastPeakIndexRef.current) {
        playBeep();
        lastPeakIndexRef.current = peakIdx;
      }
    });
  }, [ecgValues, ecgTimestamps, samplingRate, isPlaying, playBeep]);

  return {
    playBeep,
  };
}
