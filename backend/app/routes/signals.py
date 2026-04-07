"""API routes for ECG and SpO2 signal streaming."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..services.signal_generator import SignalGenerator
from ..services.data_service import DataService
from datetime import datetime
import hashlib

router = APIRouter(prefix="/signals", tags=["signals"])


def _seed_from_values(values: list) -> int:
    raw = "|".join(str(v) for v in values).encode("utf-8")
    digest = hashlib.sha256(raw).hexdigest()
    return int(digest[:8], 16)


class Timestamp(BaseModel):
    """Time value in seconds."""
    value: float


class ECGSignal(BaseModel):
    """ECG waveform data."""
    timestamps: List[float]
    values: List[float]
    heart_rate: int
    sampling_rate: int


class SpO2Signal(BaseModel):
    """SpO2 time-series data."""
    timestamps: List[float]
    values: List[int]
    average: int


class ECGLeads(BaseModel):
    """Multi-lead ECG data."""
    lead_i: ECGSignal
    lead_ii: ECGSignal
    lead_iii: ECGSignal


class SignalResponse(BaseModel):
    """Complete signal data for a patient."""
    patient_id: int
    timestamp: str
    ecg: ECGSignal
    leads: Optional[ECGLeads] = None
    spo2: SpO2Signal
    alerts: Dict[str, Any]


class ECGRequest(BaseModel):
    """Manual vitals for ECG generation."""
    heart_rate: int
    systolic_bp: int
    diastolic_bp: int
    spo2: int
    temperature: float
    respiratory_rate: int


@router.get("/{patient_id}", response_model=SignalResponse)
async def get_patient_signals(patient_id: int) -> Dict[str, Any]:
    """
    Get ECG waveform and SpO2 time-series for a specific patient.

    The signals are synthesized based on the patient's heart rate from the dataset.
    ECG is generated with realistic P-QRS-T morphology at 250 Hz.
    SpO2 is generated with realistic variations at 1 Hz.

    Args:
        patient_id: The ID of the patient

    Returns:
        Dictionary containing:
            - patient_id: Patient identifier
            - timestamp: ISO timestamp when signals were generated
            - ecg: ECG signal data (timestamps, values in mV, HR, sampling rate)
            - spo2: SpO2 signal data (timestamps, values in %, average)
            - alerts: Alert status based on vital signs

    Raises:
        HTTPException: 404 if patient not found

    Example:
        GET /api/v1/signals/1
        {
            "patient_id": 1,
            "timestamp": "2026-04-05T10:30:00",
            "ecg": {
                "timestamps": [0, 0.004, 0.008, ...],
                "values": [0.0, 0.1, 0.5, ...],
                "heart_rate": 75,
                "sampling_rate": 250
            },
            "spo2": {
                "timestamps": [0, 1, 2, ...],
                "values": [98, 97, 98, 99, ...],
                "average": 98
            },
            "alerts": {
                "heart_rate_alerts": [],
                "spo2_alerts": [],
                "overall_severity": "normal"
            }
        }
    """
    # Get patient to verify exists and retrieve heart rate
    data_service = DataService()
    patient = data_service.get_patient_by_id(patient_id)

    if patient is None:
        raise HTTPException(
            status_code=404, detail=f"Patient with ID {patient_id} not found"
        )

    # Extract heart rate from patient data
    heart_rate = patient.heart_rate

    # Generate signals
    signal_gen = SignalGenerator()
    seed = _seed_from_values([patient_id, heart_rate])
    leads = signal_gen.generate_multi_lead_ecg(heart_rate, duration=10, seed=seed)
    ecg_data = leads["lead_ii"]
    spo2_data = signal_gen.generate_spo2_signal(heart_rate, duration=60, seed=seed)

    # Calculate alerts based on signals
    # Use the first SpO2 value for alert calculation
    current_spo2 = spo2_data["values"][0] if spo2_data["values"] else 98
    alerts = signal_gen.calculate_alerts(heart_rate, current_spo2)

    # Return formatted response
    return {
        "patient_id": patient_id,
        "timestamp": datetime.utcnow().isoformat(),
        "ecg": ECGSignal(**ecg_data),
        "leads": ECGLeads(
            lead_i=ECGSignal(**leads["lead_i"]),
            lead_ii=ECGSignal(**leads["lead_ii"]),
            lead_iii=ECGSignal(**leads["lead_iii"]),
        ),
        "spo2": SpO2Signal(**spo2_data),
        "alerts": alerts,
    }


@router.post("/generate", response_model=SignalResponse)
async def generate_ecg_signal(request: ECGRequest) -> Dict[str, Any]:
    """
    Generate ECG waveform based on provided vitals.

    Returns a multi-lead ECG plus SpO2 signal with derived alerts.
    """
    signal_gen = SignalGenerator()

    seed = _seed_from_values(
        [
            request.heart_rate,
            request.systolic_bp,
            request.diastolic_bp,
            request.spo2,
            request.temperature,
            request.respiratory_rate,
        ]
    )
    leads = signal_gen.generate_multi_lead_ecg(request.heart_rate, duration=10, seed=seed)
    ecg_data = leads["lead_ii"]
    spo2_data = signal_gen.generate_spo2_signal(
        request.heart_rate,
        duration=60,
        base_spo2=request.spo2,
        seed=seed,
    )

    current_spo2 = spo2_data["values"][0] if spo2_data["values"] else request.spo2
    alerts = signal_gen.calculate_alerts(request.heart_rate, current_spo2)

    return {
        "patient_id": 0,
        "timestamp": datetime.utcnow().isoformat(),
        "ecg": ECGSignal(**ecg_data),
        "leads": ECGLeads(
            lead_i=ECGSignal(**leads["lead_i"]),
            lead_ii=ECGSignal(**leads["lead_ii"]),
            lead_iii=ECGSignal(**leads["lead_iii"]),
        ),
        "spo2": SpO2Signal(**spo2_data),
        "alerts": alerts,
    }


@router.get("/{patient_id}/metadata")
async def get_signal_metadata(patient_id: int) -> Dict[str, Any]:
    """
    Get metadata about available signals for a patient.

    Useful for frontend to understand signal characteristics
    without fetching all data.

    Args:
        patient_id: The ID of the patient

    Returns:
        Dictionary containing signal metadata:
            - ecg_sampling_rate: Hz
            - ecg_duration: seconds
            - spo2_sampling_rate: Hz
            - spo2_duration: seconds
            - ecg_samples_per_second: approximate

    Raises:
        HTTPException: 404 if patient not found
    """
    # Verify patient exists
    data_service = DataService()
    patient = data_service.get_patient_by_id(patient_id)

    if patient is None:
        raise HTTPException(
            status_code=404, detail=f"Patient with ID {patient_id} not found"
        )

    signal_gen = SignalGenerator()

    return {
        "patient_id": patient_id,
        "ecg": {
            "sampling_rate": signal_gen.ECG_SAMPLING_RATE,
            "duration": signal_gen.ECG_DURATION,
            "total_samples": signal_gen.ECG_SAMPLING_RATE * signal_gen.ECG_DURATION,
            "render_fps": 30,  # Frontend rendering frame rate
            "downsample_factor": signal_gen.ECG_SAMPLING_RATE // 30,
        },
        "spo2": {
            "sampling_rate": signal_gen.SPO2_SAMPLING_RATE,
            "duration": signal_gen.SPO2_DURATION,
            "total_samples": signal_gen.SPO2_DURATION,
        },
    }
