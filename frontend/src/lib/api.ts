import axios from 'axios';
import { Patient, PatientBrief, AIAnalysis } from '../types/patient';
import { SignalResponse, SignalMetadata, VitalSigns } from '../types/signals';

const API_BASE_URL = 'https://heart-twin-960700171922.europe-west1.run.app/api/v1';

export const api = {
  getPatients: async (): Promise<PatientBrief[]> => {
    const response = await axios.get(`${API_BASE_URL}/patients`);
    return response.data;
  },
  getPatient: async (id: number): Promise<Patient> => {
    const response = await axios.get(`${API_BASE_URL}/patients/${id}`);
    return response.data;
  },
  updateVitals: async (id: number, vitals: Partial<Patient>): Promise<Patient> => {
    const response = await axios.put(`${API_BASE_URL}/patients/${id}/vitals`, vitals);
    return response.data;
  },
  getAIAnalysis: async (data: Partial<Patient>): Promise<AIAnalysis> => {
    const response = await axios.post(`${API_BASE_URL}/analysis/ai`, data);
    return response.data;
  },
  getSignals: async (patientId: number): Promise<SignalResponse> => {
    const response = await axios.get(`${API_BASE_URL}/signals/${patientId}`);
    return response.data;
  },
  getSignalMetadata: async (patientId: number): Promise<SignalMetadata> => {
    const response = await axios.get(`${API_BASE_URL}/signals/${patientId}/metadata`);
    return response.data;
  },
  generateSignals: async (vitals: VitalSigns): Promise<SignalResponse> => {
    const response = await axios.post(`${API_BASE_URL}/signals/generate`, vitals);
    return response.data;
  },
};
