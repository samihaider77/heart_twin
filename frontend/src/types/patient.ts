export interface Patient {
  id: number;
  age: number;
  sex: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  max_hr: number;
  cholesterol: number;
  st_depression: number;
  exercise_angina: boolean;
  hrv: number;
  ejection_fraction: number;
  stroke_volume: number;
  cardiac_output: number;
  disease_severity: number;
}

export interface PatientBrief {
  id: number;
  label: string;
  age: number;
  sex: string;
}

export interface AIAnalysis {
  observation: string;
  risk_factor: string;
  recommendation: string;
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'unknown';
}
