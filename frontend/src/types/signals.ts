/**
 * TypeScript types for real-time ECG and SpO2 signal monitoring.
 */

/**
 * ECG (Electrocardiogram) signal data.
 * Represents heart electrical activity at 250 Hz sampling rate.
 */
export interface ECGSignal {
  /** Time values in seconds */
  timestamps: number[];
  /** ECG amplitude values in millivolts (mV) */
  values: number[];
  /** Current patient heart rate in beats per minute */
  heart_rate: number;
  /** Sampling rate in Hz (typically 250) */
  sampling_rate: number;
}

/**
 * Multi-lead ECG data.
 */
export interface ECGLeads {
  lead_i: ECGSignal;
  lead_ii: ECGSignal;
  lead_iii: ECGSignal;
}

/**
 * SpO2 (Oxygen Saturation) signal data.
 * Represents blood oxygen percentage over time.
 */
export interface SpO2Signal {
  /** Time values in seconds */
  timestamps: number[];
  /** SpO2 values in percentage (typically 95-100%) */
  values: number[];
  /** Mean SpO2 across the signal duration */
  average: number;
}

/**
 * Alert information for abnormal vital signs.
 */
export interface Alert {
  /** Type of alert (e.g., 'bradycardia', 'tachycardia', 'low_spo2') */
  type: string;
  /** Severity level: 'warning' or 'critical' */
  severity: 'warning' | 'critical';
}

/**
 * Complete vital signs alert status.
 */
export interface AlertStatus {
  /** Heart rate-related alerts */
  heart_rate_alerts: Alert[];
  /** SpO2-related alerts */
  spo2_alerts: Alert[];
  /** Overall severity: 'normal', 'warning', or 'critical' */
  overall_severity: 'normal' | 'warning' | 'critical';
}

/**
 * Complete signal data response from backend API.
 */
export interface SignalResponse {
  /** Patient identifier */
  patient_id: number;
  /** ISO timestamp when signals were generated */
  timestamp: string;
  /** ECG waveform data */
  ecg: ECGSignal;
  /** Optional multi-lead ECG data */
  leads?: ECGLeads;
  /** SpO2 time-series data */
  spo2: SpO2Signal;
  /** Alert status based on vital signs */
  alerts: AlertStatus;
}

/**
 * Manual vital signs control payload.
 */
export interface VitalSigns {
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  spo2: number;
  temperature: number;
  respiratory_rate: number;
}

/**
 * Metadata about available signals for a patient.
 */
export interface SignalMetadata {
  patient_id: number;
  ecg: {
    sampling_rate: number;
    duration: number;
    total_samples: number;
    render_fps: number;
    downsample_factor: number;
  };
  spo2: {
    sampling_rate: number;
    duration: number;
    total_samples: number;
  };
}

/**
 * Detected R-peak information from ECG.
 * Used for heart rate calculation and audio sync.
 */
export interface RPeakInfo {
  /** Sample indices of R-peaks */
  indices: number[];
  /** Detected heart rate in bpm */
  heart_rate: number;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Window of signal data visible on screen.
 */
export interface SignalWindow {
  /** Timestamps for visible data points */
  timestamps: number[];
  /** Values for visible data points */
  values: number[];
  /** Start time of window (seconds) */
  startTime: number;
  /** End time of window (seconds) */
  endTime: number;
  /** Whether display is paused */
  isPaused: boolean;
}

/**
 * Streaming state for signal animation.
 */
export interface StreamingState {
  /** Currently visible ECG window */
  ecgWindow: SignalWindow;
  /** Optional multi-lead windows */
  leadWindows?: {
    lead_i: SignalWindow;
    lead_ii: SignalWindow;
    lead_iii: SignalWindow;
  };
  /** Currently visible SpO2 window */
  spo2Window: SignalWindow;
  /** Detected heart rate from ECG */
  detectedHeartRate: number;
  /** Current alerts */
  alerts: AlertStatus;
  /** Playing or paused */
  isPlaying: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}
