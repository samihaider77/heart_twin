from pydantic import BaseModel
from typing import Optional, List

class PatientBase(BaseModel):
    age: int
    sex: str
    systolic_bp: int
    diastolic_bp: int
    heart_rate: int
    cholesterol: int

class PatientResponse(PatientBase):
    id: int
    max_hr: int
    st_depression: float
    exercise_angina: bool
    hrv: int
    ejection_fraction: int
    stroke_volume: int
    cardiac_output: float
    disease_severity: int

class PatientBrief(BaseModel):
    id: int
    label: str
    age: int
    sex: str

class VitalsUpdate(BaseModel):
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    cholesterol: Optional[int] = None

class AIAnalysisRequest(BaseModel):
    systolic_bp: int
    diastolic_bp: int
    heart_rate: int
    ejection_fraction: int
    st_depression: float
    cholesterol: int

class AIAnalysisResponse(BaseModel):
    observation: str
    risk_factor: str
    recommendation: str
    risk_score: int
    risk_level: str  # "low", "moderate", "high"
