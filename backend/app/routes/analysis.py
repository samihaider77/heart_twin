from fastapi import APIRouter
from ..services.ai_service import AIService
from ..models.patient import AIAnalysisRequest, AIAnalysisResponse

router = APIRouter(prefix="/analysis", tags=["analysis"])
ai_service = AIService()

@router.post("/ai", response_model=AIAnalysisResponse)
async def get_ai_analysis(data: AIAnalysisRequest):
    """Get AI-generated cardiac analysis"""
    return ai_service.get_analysis(data)
