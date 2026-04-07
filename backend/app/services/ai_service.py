import os

import ollama
from ..models.patient import AIAnalysisRequest, AIAnalysisResponse

class AIService:
    def __init__(self, model_name=None):
        self.model_name = model_name or os.getenv("OLLAMA_MODEL", "gemma3:4b")
        self.timeout_seconds = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))
        self.client = ollama.Client(
            host=os.getenv("OLLAMA_HOST"),
            timeout=self.timeout_seconds,
        )

    def get_analysis(self, data: AIAnalysisRequest) -> AIAnalysisResponse:
        risk_score, risk_level = self._calculate_risk_score(data)
        prompt = f"""
        You are a cardiologist reviewing a patient's digital twin data.
        
        Patient Vitals:
        - Blood Pressure: {data.systolic_bp}/{data.diastolic_bp} mmHg
        - Heart Rate: {data.heart_rate} bpm
        - Cholesterol: {data.cholesterol} mg/dL
        - ST Depression: {data.st_depression} mm
        - Ejection Fraction: {data.ejection_fraction}%
        
        Provide:
        1. ONE-SENTENCE clinical observation
        2. ONE specific risk factor (if any)
        3. ONE lifestyle recommendation
        
        Format your response EXACTLY as: Observation | Risk | Recommendation
        """
        
        try:
            response = self.client.chat(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            ai_text = response["message"]["content"].strip()
            parts = [p.strip() for p in ai_text.split('|')]
            
            if len(parts) < 3:
                return self._fallback_response(
                    "Unexpected AI response format.",
                    risk_score,
                    risk_level,
                )
            
            return AIAnalysisResponse(
                observation=parts[0],
                risk_factor=parts[1],
                recommendation=parts[2],
                risk_score=risk_score,
                risk_level=risk_level
            )
        except Exception as e:
            return self._fallback_response(
                str(e) or f"Ollama request timed out after {self.timeout_seconds} seconds.",
                risk_score,
                risk_level,
            )

    def _calculate_risk_score(self, data: AIAnalysisRequest):
        score = 0
        if data.systolic_bp > 140: score += 2
        if data.diastolic_bp > 90: score += 2
        if data.heart_rate > 100 or data.heart_rate < 60: score += 1
        if data.ejection_fraction < 50: score += 3
        if data.st_depression > 1.5: score += 2
        
        level = "low"
        if score >= 6: level = "high"
        elif score >= 3: level = "moderate"
        
        return score, level

    def _fallback_response(self, error_msg: str, risk_score: int, risk_level: str):
        return AIAnalysisResponse(
            observation="AI Analysis unavailable.",
            risk_factor=f"Error: {error_msg}",
            recommendation="Please ensure Ollama is running and gemma3:4b is installed.",
            risk_score=risk_score,
            risk_level=risk_level
        )
