from fastapi import APIRouter, HTTPException
from ..services.data_service import DataService
from ..models.patient import PatientResponse, PatientBrief, VitalsUpdate
from typing import List

router = APIRouter(prefix="/patients", tags=["patients"])
data_service = DataService()

def dump_model(model):
    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_none=True)
    return model.dict(exclude_none=True)

@router.get("/", response_model=List[PatientBrief])
async def get_all_patients():
    """Get list of all patients"""
    return data_service.get_patient_list()

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int):
    """Get detailed metrics for a specific patient"""
    patient = data_service.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}/vitals")
async def update_vitals(patient_id: int, vitals: VitalsUpdate):
    """Update patient vitals and recalculate derived metrics"""
    updated = data_service.update_patient_vitals(patient_id, dump_model(vitals))
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    return updated
