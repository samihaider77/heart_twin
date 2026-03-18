import pandas as pd
import random
import os
from typing import List, Optional, Dict
from ..models.patient import PatientResponse, PatientBrief

class DataService:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_path = os.path.join(base_dir, "data", "heart_disease_uci.csv")
        self.df = pd.read_csv(csv_path)
        self.patients_cache = {}

    @staticmethod
    def _dump_model(model: PatientResponse) -> Dict:
        if hasattr(model, "model_dump"):
            return model.model_dump()
        return model.dict()

    @staticmethod
    def _estimate_stroke_volume(cholesterol: int, disease_severity: int) -> int:
        baseline = int(cholesterol / 3)
        adjusted = baseline - (disease_severity * 4)
        return max(45, min(120, adjusted))

    def get_patient_list(self) -> List[PatientBrief]:
        return [
            PatientBrief(
                id=int(row['id']),
                label=f"Patient {row['id']} | Age {row['age']} {row['sex']}",
                age=int(row['age']),
                sex=str(row['sex'])
            ) for _, row in self.df.iterrows()
        ]

    def get_patient_by_id(self, patient_id: int) -> Optional[PatientResponse]:
        if patient_id in self.patients_cache:
            return self.patients_cache[patient_id]

        row = self.df[self.df['id'] == patient_id]
        if row.empty:
            return None
        
        row = row.iloc[0]
        metrics = self._calculate_derived_metrics(row)
        patient = PatientResponse(
            id=int(row['id']),
            age=int(row['age']),
            sex=str(row['sex']),
            systolic_bp=metrics['systolic_bp'],
            diastolic_bp=metrics['diastolic_bp'],
            heart_rate=metrics['heart_rate'],
            max_hr=metrics['max_hr'],
            cholesterol=metrics['cholesterol'],
            st_depression=metrics['st_depression'],
            exercise_angina=metrics['exercise_angina'],
            hrv=metrics['hrv'],
            ejection_fraction=metrics['ejection_fraction'],
            stroke_volume=metrics['stroke_volume'],
            cardiac_output=metrics['cardiac_output'],
            disease_severity=int(row['num'] if not pd.isna(row['num']) else 0)
        )
        self.patients_cache[patient_id] = patient
        return patient

    def update_patient_vitals(self, patient_id: int, updates: Dict) -> Optional[Dict]:
        patient = self.get_patient_by_id(patient_id)
        if not patient:
            return None

        for key, value in updates.items():
            if hasattr(patient, key):
                setattr(patient, key, value)

        # Keep downstream metrics in sync when interactive vitals change.
        patient.stroke_volume = self._estimate_stroke_volume(
            patient.cholesterol,
            patient.disease_severity,
        )
        patient.cardiac_output = round((patient.heart_rate * patient.stroke_volume) / 1000, 2)
        
        # In a real app update DB/CSV. Here we just update cache.
        self.patients_cache[patient_id] = patient
        return self._dump_model(patient)

    def _calculate_derived_metrics(self, row) -> Dict:
        trestbps = row['trestbps'] if not pd.isna(row['trestbps']) else 120
        chol = row['chol'] if not pd.isna(row['chol']) else 200
        thalach = row['thalch'] if not pd.isna(row['thalch']) else 150
        oldpeak = row['oldpeak'] if not pd.isna(row['oldpeak']) else 0.0
        exang = row['exang'] == 'True' if isinstance(row['exang'], str) else bool(row['exang'])
        age = row['age']
        num = row['num'] if not pd.isna(row['num']) else 0

        systolic_bp = int(trestbps)
        diastolic_bp = int(trestbps * 0.66)
        heart_rate = int(thalach * 0.75 + random.randint(10, 20))
        max_hr = int(thalach)
        st_depression = float(oldpeak)
        exercise_angina = bool(exang)
        hrv = max(20, 80 - (int(age) - 40) + random.randint(-10, 10))
        ejection_fraction = max(30, min(70, 60 - (int(num) * 8) + random.randint(-5, 5)))
        stroke_volume = self._estimate_stroke_volume(int(chol), int(num)) + random.randint(-5, 5)
        stroke_volume = max(45, min(120, stroke_volume))
        cardiac_output = round((heart_rate * stroke_volume) / 1000, 2)

        return {
            'systolic_bp': systolic_bp,
            'diastolic_bp': diastolic_bp,
            'heart_rate': heart_rate,
            'max_hr': max_hr,
            'cholesterol': int(chol),
            'st_depression': st_depression,
            'exercise_angina': exercise_angina,
            'hrv': hrv,
            'ejection_fraction': ejection_fraction,
            'stroke_volume': stroke_volume,
            'cardiac_output': cardiac_output
        }
