/**
 * Signal processing utilities for ECG and SpO2 data.
 * Handles peak detection, heart rate calculation, and data analysis.
 */

import { Alert, AlertStatus, RPeakInfo } from '@/types/signals';

/**
 * Simplified R-peak detection using basic peak finding algorithm.
 * For a production system, consider using scipy.signal peak detection
 * ported to JavaScript or a WebAssembly ECG processing library.
 *
 * @param ecgValues - Array of ECG amplitude values
 * @param samplingRate - Sampling rate in Hz (default: 250)
 * @param minDistance - Minimum samples between peaks (prevents multiple detections)
 * @returns Array of sample indices where R-peaks likely occur
 */
export function detectRPeaks(
  ecgValues: number[],
  samplingRate: number = 500,
  minDistance: number = 200 // ~0.4 seconds at 500 Hz, prevents HR > 150 false positives
): number[] {
  if (ecgValues.length < minDistance * 2) {
    return [];
  }

  const peaks: number[] = [];
  let lastPeakIndex = -minDistance;

  // Find local maxima (R-peaks are typically high amplitude positive deflections)
  for (let i = 1; i < ecgValues.length - 1; i++) {
    if (
      ecgValues[i] > ecgValues[i - 1] &&
      ecgValues[i] > ecgValues[i + 1] &&
      i - lastPeakIndex >= minDistance
    ) {
      peaks.push(i);
      lastPeakIndex = i;
    }
  }

  return peaks;
}

/**
 * Calculate heart rate from R-peak positions.
 *
 * @param rPeakIndices - Sample indices of detected R-peaks
 * @param samplingRate - Sampling rate in Hz
 * @returns Object containing HR and confidence metrics
 */
export function calculateHeartRateFromPeaks(
  rPeakIndices: number[],
  samplingRate: number = 500
): RPeakInfo {
  // Need at least 2 peaks to calculate rate
  if (rPeakIndices.length < 2) {
    return {
      indices: rPeakIndices,
      heart_rate: 0,
      confidence: 0,
    };
  }

  // Convert indices to time (seconds)
  const rPeakTimes = rPeakIndices.map((idx) => idx / samplingRate);

  // Calculate intervals between consecutive peaks (RR intervals in seconds)
  const rrIntervals: number[] = [];
  for (let i = 1; i < rPeakTimes.length; i++) {
    rrIntervals.push(rPeakTimes[i] - rPeakTimes[i - 1]);
  }

  // Calculate mean and check consistency
  const meanRR = rrIntervals.reduce((sum, val) => sum + val, 0) / rrIntervals.length;
  const stdRR =
    Math.sqrt(
      rrIntervals.reduce((sum, val) => sum + (val - meanRR) ** 2, 0) /
        rrIntervals.length
    ) / meanRR;

  // Heart rate = 60 / RR interval
  const heartRate = meanRR > 0 ? 60.0 / meanRR : 0;

  // Confidence based on RR consistency (lower std = higher confidence)
  // stdRR < 0.1 is very consistent, > 0.2 is noisy
  const confidence = Math.max(0, Math.min(1, 1 - stdRR));

  return {
    indices: rPeakIndices,
    heart_rate: Math.round(heartRate * 10) / 10, // Round to 1 decimal
    confidence,
  };
}

/**
 * Downsample signal by averaging over sample windows.
 * Useful for reducing rendering load (250 Hz → 30 Hz for display).
 *
 * @param values - Original signal values
 * @param fromRate - Original sampling rate (Hz)
 * @param toRate - Target sampling rate (Hz)
 * @returns Downsampled values
 */
export function downsampleSignal(
  values: number[],
  fromRate: number,
  toRate: number
): number[] {
  if (toRate >= fromRate) {
    return values;
  }

  const factor = Math.round(fromRate / toRate);
  const downsampled: number[] = [];

  for (let i = 0; i < values.length; i += factor) {
    const window = values.slice(i, i + factor);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    downsampled.push(avg);
  }

  return downsampled;
}

/**
 * Generate alert status based on vital signs.
 *
 * @param heartRate - Current heart rate in bpm
 * @param spo2 - Current SpO2 in percentage
 * @returns Alert status object
 */
export function calculateAlerts(heartRate: number, spo2: number): AlertStatus {
  const heartRateAlerts: Alert[] = [];
  const spo2Alerts: Alert[] = [];

  // Heart rate thresholds
  if (heartRate < 60) {
    heartRateAlerts.push({
      type: 'bradycardia',
      severity: 'warning',
    });
  } else if (heartRate > 100 && heartRate < 140) {
    heartRateAlerts.push({
      type: 'tachycardia',
      severity: 'warning',
    });
  } else if (heartRate >= 140) {
    heartRateAlerts.push({
      type: 'tachycardia_critical',
      severity: 'critical',
    });
  }

  // SpO2 thresholds
  if (spo2 < 90) {
    spo2Alerts.push({
      type: 'critical_hypoxia',
      severity: 'critical',
    });
  } else if (spo2 < 95) {
    spo2Alerts.push({
      type: 'low_spo2',
      severity: 'warning',
    });
  }

  // Overall severity
  let overallSeverity: 'normal' | 'warning' | 'critical' = 'normal';
  if (heartRateAlerts.length > 0 || spo2Alerts.length > 0) {
    const hasCritical =
      heartRateAlerts.some((a) => a.severity === 'critical') ||
      spo2Alerts.some((a) => a.severity === 'critical');
    overallSeverity = hasCritical ? 'critical' : 'warning';
  }

  return {
    heart_rate_alerts: heartRateAlerts,
    spo2_alerts: spo2Alerts,
    overall_severity: overallSeverity,
  };
}

/**
 * Find visible indices for a time window in a timestamp array.
 *
 * @param timestamps - Array of time values in seconds
 * @param startTime - Window start time (seconds)
 * @param endTime - Window end time (seconds)
 * @returns Object with start and end indices
 */
export function findWindowIndices(
  timestamps: number[],
  startTime: number,
  endTime: number
): { startIdx: number; endIdx: number } {
  let startIdx = 0;
  let endIdx = timestamps.length - 1;

  // Binary search for start index
  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] >= startTime) {
      startIdx = i;
      break;
    }
  }

  // Linear search for end index (typically close to length)
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (timestamps[i] <= endTime) {
      endIdx = i;
      break;
    }
  }

  return { startIdx, endIdx };
}

/**
 * Normalize signal to a standard range for display.
 * Useful for preventing clipping or scaling across different signal types.
 *
 * @param values - Signal values
 * @param targetMin - Target minimum value (default: -1)
 * @param targetMax - Target maximum value (default: 1)
 * @returns Normalized values
 */
export function normalizeSignal(
  values: number[],
  targetMin: number = -1,
  targetMax: number = 1
): number[] {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // Avoid division by zero

  return values.map((val) => {
    const normalized = (val - min) / range;
    return normalized * (targetMax - targetMin) + targetMin;
  });
}

/**
 * Calculate moving average of signal for smoothing.
 *
 * @param values - Signal values
 * @param windowSize - Number of samples in moving average window
 * @returns Smoothed signal (slightly shorter due to window)
 */
export function movingAverage(values: number[], windowSize: number = 5): number[] {
  if (windowSize <= 1 || values.length < windowSize) {
    return values;
  }

  const smoothed: number[] = [];

  for (let i = 0; i < values.length - windowSize + 1; i++) {
    const window = values.slice(i, i + windowSize);
    const avg = window.reduce((a, b) => a + b, 0) / windowSize;
    smoothed.push(avg);
  }

  return smoothed;
}
