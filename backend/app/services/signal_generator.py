"""
Signal generation service for realistic ECG and SpO2 waveforms.

Generates synthetic physiological signals based on patient heart rate,
mimicking real cardiac monitoring data from hospital-grade equipment.
"""

import hashlib
import numpy as np
from typing import Dict, List, Tuple, Optional
import neurokit2 as nk


class SignalGenerator:
    """Generate realistic ECG and SpO2 signals for cardiac monitoring."""

    # ECG signal parameters
    ECG_SAMPLING_RATE = 500  # Hz
    ECG_DURATION = 10  # seconds
    ECG_NOISE = 0.008  # Lower noise for stable display
    ECG_BASELINE_WANDER_HZ = 0.33
    ECG_BASELINE_WANDER_AMP = 0.05  # mV
    ECG_POWERLINE_HZ = 50
    ECG_POWERLINE_AMP = 0.01  # mV
    ECG_EMG_AMP = 0.02  # mV
    ECG_ELECTRODE_POP_AMP = 0.12  # mV
    ECG_ELECTRODE_POP_WIDTH_SEC = 0.35

    # SpO2 signal parameters
    SPO2_SAMPLING_RATE = 1  # Hz
    SPO2_DURATION = 60  # seconds
    SPO2_NORMAL_RANGE = (95, 100)
    SPO2_ABNORMAL_RANGE = (94, 97)

    @staticmethod
    def generate_ecg_signal(heart_rate: int, duration: int = 10) -> Dict:
        """
        Generate realistic ECG waveform based on patient's heart rate.

        Args:
            heart_rate: Patient's heart rate in beats per minute (40-200 bpm)
            duration: Length of signal in seconds (default: 10)

        Returns:
            Dictionary containing:
                - timestamps: Array of time values in seconds
                - values: ECG amplitude in mV
                - heart_rate: Input heart rate (bpm)
                - sampling_rate: 250 Hz
        """
        # Clamp heart rate to realistic range
        heart_rate = max(40, min(200, heart_rate))

        return SignalGenerator.generate_realistic_ecg(heart_rate, duration)

    @staticmethod
    def generate_realistic_ecg(
        heart_rate: int, duration: int = 10, seed: Optional[int] = None
    ) -> Dict:
        """
        Generate medically realistic ECG with P-QRS-T morphology.

        Args:
            heart_rate: Heart rate in bpm
            duration: Length of signal in seconds

        Returns:
            Dictionary with timestamps, values, heart_rate, sampling_rate
        """
        # Flatline for zero or negative heart rate
        if heart_rate <= 0:
            num_samples = int(duration * SignalGenerator.ECG_SAMPLING_RATE)
            timestamps = np.arange(num_samples) / SignalGenerator.ECG_SAMPLING_RATE
            values = np.zeros(num_samples)
            return {
                "timestamps": timestamps.tolist(),
                "values": values.tolist(),
                "heart_rate": 0,
                "sampling_rate": SignalGenerator.ECG_SAMPLING_RATE,
            }

        # Clamp heart rate to realistic range
        heart_rate = max(40, min(200, heart_rate))

        ecg = nk.ecg_simulate(
            duration=duration,
            sampling_rate=SignalGenerator.ECG_SAMPLING_RATE,
            heart_rate=heart_rate,
            method="ecgsyn",
            noise=SignalGenerator.ECG_NOISE,
            random_state=seed if seed is not None else 42,
        )

        rng = np.random.default_rng(seed if seed is not None else 42)
        time = np.arange(len(ecg)) / SignalGenerator.ECG_SAMPLING_RATE

        # Add baseline wander (respiration-like low frequency)
        baseline_wander = (
            SignalGenerator.ECG_BASELINE_WANDER_AMP
            * np.sin(2 * np.pi * SignalGenerator.ECG_BASELINE_WANDER_HZ * time)
        )
        ecg = ecg + baseline_wander

        # Add power line interference
        powerline_noise = (
            SignalGenerator.ECG_POWERLINE_AMP
            * np.sin(2 * np.pi * SignalGenerator.ECG_POWERLINE_HZ * time)
        )
        ecg = ecg + powerline_noise

        # Add muscle artifact (high-frequency noise)
        emg_noise = rng.normal(0, SignalGenerator.ECG_EMG_AMP, len(ecg))
        ecg = ecg + emg_noise

        # Add electrode pop (short transient)
        if len(ecg) > 0:
            pop_center = rng.integers(0, len(ecg))
            pop_width = int(
                SignalGenerator.ECG_ELECTRODE_POP_WIDTH_SEC
                * SignalGenerator.ECG_SAMPLING_RATE
            )
            if pop_width > 0:
                start = max(0, pop_center - pop_width // 2)
                end = min(len(ecg), pop_center + pop_width // 2)
                pop_shape = np.hanning(end - start)
                ecg[start:end] += pop_shape * SignalGenerator.ECG_ELECTRODE_POP_AMP

        # Normalize amplitude to approximately -1 to 1 mV range
        ecg_min = np.min(ecg)
        ecg_max = np.max(ecg)
        denom = ecg_max - ecg_min if ecg_max != ecg_min else 1.0
        ecg = (ecg - ecg_min) / denom
        ecg = ecg * 2 - 1

        num_samples = len(ecg)
        timestamps = np.arange(num_samples) / SignalGenerator.ECG_SAMPLING_RATE

        return {
            "timestamps": timestamps.tolist(),
            "values": ecg.tolist(),
            "heart_rate": heart_rate,
            "sampling_rate": SignalGenerator.ECG_SAMPLING_RATE,
        }

    @staticmethod
    def generate_multi_lead_ecg(
        heart_rate: int, duration: int = 10, seed: Optional[int] = None
    ) -> Dict[str, Dict]:
        """
        Generate 3 ECG leads with realistic inter-lead differences.

        Args:
            heart_rate: Heart rate in bpm
            duration: Length of signal in seconds

        Returns:
            Dictionary with lead_i, lead_ii, lead_iii
        """
        lead_ii = SignalGenerator.generate_realistic_ecg(heart_rate, duration, seed=seed)
        if lead_ii["heart_rate"] <= 0:
            return {
                "lead_i": lead_ii,
                "lead_ii": lead_ii,
                "lead_iii": lead_ii,
            }

        lead_ii_values = np.array(lead_ii["values"], dtype=float)
        rng = np.random.default_rng(seed if seed is not None else 42)
        noise = rng.normal(0, 0.01, len(lead_ii_values))
        lead_i_values = lead_ii_values * 0.8 + noise
        lead_iii_values = lead_ii_values - lead_i_values

        lead_i = {
            "timestamps": lead_ii["timestamps"],
            "values": lead_i_values.tolist(),
            "heart_rate": lead_ii["heart_rate"],
            "sampling_rate": lead_ii["sampling_rate"],
        }
        lead_iii = {
            "timestamps": lead_ii["timestamps"],
            "values": lead_iii_values.tolist(),
            "heart_rate": lead_ii["heart_rate"],
            "sampling_rate": lead_ii["sampling_rate"],
        }

        return {
            "lead_i": lead_i,
            "lead_ii": lead_ii,
            "lead_iii": lead_iii,
        }

    @staticmethod
    def generate_spo2_signal(
        heart_rate: int,
        duration: int = 60,
        base_spo2: Optional[int] = None,
        seed: Optional[int] = None,
    ) -> Dict:
        """
        Generate realistic SpO2 (oxygen saturation) values.

        SpO2 is correlated with heart rate and varies within normal ranges.

        Args:
            heart_rate: Patient's heart rate in bpm (affects baseline SpO2)
            duration: Length of signal in seconds (default: 60)

        Returns:
            Dictionary containing:
                - timestamps: Array of time values in seconds
                - values: SpO2 in percentage (94-100%)
                - average: Mean SpO2 value
        """
        # Determine baseline SpO2 based on heart rate health
        # Normal HR range: 60-100 bpm
        if base_spo2 is None:
            if heart_rate < 60 or heart_rate > 100:
                # Abnormal HR suggests lower baseline SpO2
                base_spo2 = 96
            else:
                # Normal HR: healthier baseline SpO2
                base_spo2 = 98

        # Create timestamps (1 sample per second)
        timestamps = np.arange(duration, dtype=float)

        # Generate SpO2 values with realistic variations
        # Add small random fluctuations (±1-2%)
        rng = np.random.default_rng(seed if seed is not None else 42)
        variations = rng.normal(0, 1.0, duration)
        spo2_values = base_spo2 + variations

        # Clip to realistic physiological range
        spo2_values = np.clip(spo2_values, 94, 100)

        # Round to integer percentage
        spo2_int = np.round(spo2_values).astype(int)

        return {
            "timestamps": timestamps.tolist(),
            "values": spo2_int.tolist(),
            "average": int(np.mean(spo2_int)),
        }

    @staticmethod
    def detect_r_peaks(ecg_values: List[float], sampling_rate: int = 250) -> List[int]:
        """
        Detect R-peak positions in ECG signal.

        R-peaks are the dominant features used to calculate heart rate.

        Args:
            ecg_values: ECG signal amplitude values
            sampling_rate: Sampling rate in Hz (default: 250)

        Returns:
            Array of sample indices where R-peaks occur
        """
        # Convert to numpy array if needed
        ecg_array = np.array(ecg_values)

        # Use neurokit2 for robust R-peak detection
        # This handles various ECG morphologies
        signals, info = nk.ecg_process(
            ecg_array, sampling_rate=sampling_rate
        )

        # Extract R-peak indices from processed signal
        r_peaks = info.get("ECG_R_Peaks", np.array([]))

        return r_peaks.tolist() if isinstance(r_peaks, np.ndarray) else list(r_peaks)

    @staticmethod
    def calculate_heart_rate_from_peaks(
        r_peak_indices: List[int], duration_seconds: float, sampling_rate: int = 250
    ) -> float:
        """
        Calculate heart rate from R-peak positions.

        Args:
            r_peak_indices: Sample indices of R-peaks
            duration_seconds: Total signal duration in seconds
            sampling_rate: Sampling rate in Hz (default: 250)

        Returns:
            Heart rate in beats per minute (bpm)
        """
        if len(r_peak_indices) < 2:
            return 0.0

        # Convert indices to time in seconds
        r_peak_times = np.array(r_peak_indices) / sampling_rate

        # Calculate intervals between consecutive R-peaks
        rr_intervals = np.diff(r_peak_times)

        # Calculate mean heart rate from mean RR interval
        # HR = 60 / RR_interval_in_seconds
        mean_rr = np.mean(rr_intervals)
        heart_rate = 60.0 / mean_rr if mean_rr > 0 else 0.0

        return float(np.clip(heart_rate, 20, 250))  # Physiologically realistic range

    @staticmethod
    def calculate_alerts(heart_rate: float, spo2: float) -> Dict:
        """
        Determine alert status based on vital signs.

        Args:
            heart_rate: Heart rate in bpm
            spo2: Oxygen saturation in percentage

        Returns:
            Dictionary with alert information
        """
        alerts = {
            "heart_rate_alerts": [],
            "spo2_alerts": [],
            "overall_severity": "normal",
        }

        # Heart rate alerts
        if heart_rate < 60:
            alerts["heart_rate_alerts"].append(
                {"type": "bradycardia", "severity": "warning"}
            )
        elif heart_rate > 100 and heart_rate < 140:
            alerts["heart_rate_alerts"].append(
                {"type": "tachycardia", "severity": "warning"}
            )
        elif heart_rate >= 140:
            alerts["heart_rate_alerts"].append(
                {"type": "tachycardia_critical", "severity": "critical"}
            )

        # SpO2 alerts
        if spo2 < 90:
            alerts["spo2_alerts"].append(
                {"type": "critical_hypoxia", "severity": "critical"}
            )
        elif spo2 < 95:
            alerts["spo2_alerts"].append(
                {"type": "low_spo2", "severity": "warning"}
            )

        # Determine overall severity
        if alerts["heart_rate_alerts"] or alerts["spo2_alerts"]:
            has_critical = any(
                a["severity"] == "critical"
                for a in alerts["heart_rate_alerts"] + alerts["spo2_alerts"]
            )
            alerts["overall_severity"] = "critical" if has_critical else "warning"

        return alerts


# Singleton instance
_signal_generator = SignalGenerator()


def get_signal_generator() -> SignalGenerator:
    """Get or create the signal generator instance."""
    return _signal_generator
