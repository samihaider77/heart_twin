import axios from 'axios';
import { Patient, PatientBrief, AIAnalysis } from '../types/patient';
import { SignalResponse, SignalMetadata, VitalSigns } from '../types/signals';

// 1. Sirf ek dafa base URL define karein (Baaki saari definitions mita dein)
const API_BASE_URL = 'https://heart-twin-960700171922.europe-west1.run.app/api/v1';

function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const backendMessage =
        typeof error.response.data?.detail === 'string'
          ? `: ${error.response.data.detail}`
          : '';
      return `Request failed with status ${error.response.status}${backendMessage}`;
    }
    if (error.request) {
      return 'Unable to reach backend API. Check backend status.';
    }
    if (error.message) {
      return error.message;
    }
  }
  return error instanceof Error ? error.message : 'Unexpected request error';
}

async function request<T>(call: () => Promise<{ data: T }>): Promise<T> {
  try {
    const response = await call();
    return response.data;
  } catch (error) {
    throw new Error(formatApiError(error));
  }
}

// 2. Client banate waqt wahi upar wala constant use karein
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const api = {
  getPatients: async (): Promise<PatientBrief[]> => {
    return request(() => apiClient.get('/patients'));
  },
  getPatient: async (id: number): Promise<Patient> => {
    return request(() => apiClient.get(`/patients/${id}`));
  },
  updateVitals: async (id: number, vitals: Partial<Patient>): Promise<Patient> => {
    return request(() => apiClient.put(`/patients/${id}/vitals`, vitals));
  },
  getAIAnalysis: async (data: Partial<Patient>): Promise<AIAnalysis> => {
    return request(() => apiClient.post('/analysis/ai', data));
  },
  getSignals: async (patientId: number): Promise<SignalResponse> => {
    return request(() => apiClient.get(`/signals/${patientId}`));
  },
  getSignalMetadata: async (patientId: number): Promise<SignalMetadata> => {
    return request(() => apiClient.get(`/signals/${patientId}/metadata`));
  },
  generateSignals: async (vitals: VitalSigns): Promise<SignalResponse> => {
    return request(() => apiClient.post('/signals/generate', vitals));
  },
};