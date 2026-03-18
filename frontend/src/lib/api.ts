import axios from 'axios';
import { Patient, PatientBrief, AIAnalysis } from '../types/patient';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '');

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
  }
};
