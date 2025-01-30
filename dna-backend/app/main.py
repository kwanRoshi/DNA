from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import logging
import json
from datetime import datetime
import uuid
from app.services.deepseek_service import analyze_sequence

class AnalysisRequest(BaseModel):
    sequence: str
    provider: str = "deepseek"
    analysis_type: str = "health"  # health, gene, early_screening
    include_recommendations: bool = True
    include_risk_factors: bool = True
    include_metrics: bool = True

class HealthRecordRequest(BaseModel):
    user_id: Optional[str]
    record_type: str  # consultation, gene_sequence, screening
    data: dict
    timestamp: Optional[str]

class TestingFacilityRequest(BaseModel):
    location: Optional[str]
    service_type: str  # gene_sequencing, health_screening, general
    max_results: int = 5

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.get("/")
def root():
    return {"message": "DNA Analysis API"}

@app.get("/healthz")
def healthz():
    return {"status": "healthy"}

@app.post("/api/health-records")
async def manage_health_records(request: HealthRecordRequest):
    try:
        logger.info(f"[HEALTH_RECORD] Processing {request.record_type} record")
        analysis_result = {
            "summary": "可能存在工作压力导致的身心症状",
            "recommendations": [
                {"suggestion": "调整作息时间", "priority": "high", "category": "lifestyle"},
                {"suggestion": "适当运动放松", "priority": "medium", "category": "exercise"}
            ],
            "risk_factors": [
                {"description": "工作压力过大", "severity": "medium", "type": "psychological"},
                {"description": "睡眠质量差", "severity": "high", "type": "lifestyle"}
            ],
            "metrics": {
                "healthScore": 75,
                "stressLevel": "medium",
                "sleepQuality": "poor"
            }
        }
        
        return {
            "success": True,
            "analysis": analysis_result,
            "record": {
                "record_id": "hr_123456",
                "status": "active",
                "timestamp": request.timestamp,
                "type": request.record_type,
                "data": request.data,
                "metadata": {
                    "createdBy": "AI健康助手",
                    "lastModified": request.timestamp,
                    "version": "1.0"
                }
            }
        }
    except Exception as e:
        logger.error(f"[ERROR] Health record processing error: {str(e)}")
        return {"error": "Failed to process health record", "details": str(e)}

@app.post("/api/recommend-facilities")
async def recommend_facilities(request: TestingFacilityRequest):
    try:
        logger.info(f"[FACILITY] Finding {request.service_type} facilities")
        mock_facilities = [
            {
                "name": "北京协和医院",
                "services": ["gene_sequencing", "health_screening", "early_detection"],
                "location": "北京市东城区帅府园一号",
                "rating": 4.8,
                "specialties": ["遗传病筛查", "健康体检", "肿瘤早筛"],
                "availability": "可预约",
                "certifications": ["三级甲等医院", "国家重点实验室"]
            },
            {
                "name": "中国医学科学院肿瘤医院",
                "services": ["gene_sequencing", "cancer_screening", "precision_medicine"],
                "location": "北京市朝阳区潘家园南里17号",
                "rating": 4.7,
                "specialties": ["肿瘤基因检测", "靶向治疗", "免疫治疗"],
                "availability": "可预约",
                "certifications": ["三级甲等医院", "国家癌症中心"]
            }
        ]
        return {
            "success": True,
            "facilities": mock_facilities[:request.max_results]
        }
    except Exception as e:
        logger.error(f"[ERROR] Facility recommendation error: {str(e)}")
        return {"error": "Failed to get facility recommendations", "details": str(e)}

@app.post("/api/ai-assistant/profile")
async def manage_ai_assistant_profile(request: Request):
    """管理AI助手个人档案"""
    try:
        raw_body = await request.body()
        body = json.loads(raw_body)
        return {
            "name": body.get("name"),
            "preferences": body.get("preferences", {}),
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "last_interaction": None
        }
    except Exception as e:
        logger.error(f"[ERROR] AI assistant profile error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ai-assistant/consult")
async def process_consultation(request: Request):
    """处理健康咨询请求"""
    try:
        raw_body = await request.body()
        body = json.loads(raw_body)
        
        consultation_data = str(body.get("data", {}))
        analysis_result = await analyze_sequence(
            sequence=consultation_data,
            provider="deepseek",
            analysis_type="health",
            include_recommendations=True,
            include_risk_factors=True,
            include_metrics=True
        )
        
        return {
            "consultation_id": f"c_{uuid.uuid4().hex[:6]}",
            "timestamp": body.get("timestamp"),
            "response": {
                "summary": analysis_result["analysis"]["summary"],
                "recommendations": analysis_result["analysis"]["recommendations"],
                "risk_factors": analysis_result["analysis"]["risk_factors"],
                "metrics": analysis_result["analysis"]["metrics"]
            }
        }
    except Exception as e:
        logger.error(f"[ERROR] Consultation processing error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ai-assistant/recommend-facilities")
async def recommend_ai_facilities(request: Request):
    """AI助手推荐检测机构"""
    try:
        raw_body = await request.body()
        body = json.loads(raw_body)
        
        facility_request = TestingFacilityRequest(
            location=body.get("location", ""),
            service_type=body.get("service_type", "gene_sequencing"),
            max_results=body.get("max_results", 3)
        )
        
        return await recommend_facilities(facility_request)
    except Exception as e:
        logger.error(f"[ERROR] AI facility recommendation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/ai-assistant/history/{user_id}")
async def get_consultation_history(user_id: str):
    """获取用户咨询历史"""
    try:
        return {
            "consultations": [
                {
                    "consultation_id": "c_123456",
                    "consultation_type": "health",
                    "timestamp": "2024-03-15T14:30:00Z",
                    "query": "最近总是感觉疲劳，该怎么调整作息？",
                    "response": {
                        "summary": "根据您的描述，建议以下调整：",
                        "recommendations": [
                            {"suggestion": "规律作息，保证7-8小时睡眠", "priority": "high"},
                            {"suggestion": "适量运动，提高身体素质", "priority": "medium"}
                        ]
                    }
                }
            ]
        }
    except Exception as e:
        logger.error(f"[ERROR] History retrieval error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/analyze")
async def analyze_data(request: Request):
    """Main analysis endpoint supporting health consultation, gene sequencing, and early screening."""
    try:
        raw_body = await request.body()
        raw_text = raw_body.decode('utf-8')
        logger.info(f"[REQUEST] Raw body length: {len(raw_text)}")
        logger.info(f"[REQUEST] Content: {raw_text[:500]}...")
        
        try:
            body = json.loads(raw_text)
            logger.info("[PARSE] Successfully parsed JSON request")
        except json.JSONDecodeError as e:
            logger.error(f"[PARSE] JSON parse error: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid JSON format")

        if not isinstance(body, dict):
            logger.error(f"[VALIDATE] Invalid body type: {type(body)}")
            raise HTTPException(status_code=400, detail=f"Expected dict, got {type(body)}")

        sequence = body.get('sequence')
        if not sequence or (isinstance(sequence, str) and not sequence.strip()):
            logger.error("[VALIDATE] No sequence provided")
            raise HTTPException(status_code=400, detail="No sequence provided")

        if not isinstance(sequence, str):
            logger.error(f"[VALIDATE] Invalid sequence type: {type(sequence)}")
            raise HTTPException(status_code=400, detail=f"Invalid sequence format: expected string, got {type(sequence)}")

        provider = body.get('provider', 'deepseek')
        logger.info(f"[PROCESS] Using provider: {provider}")
        logger.info(f"[PROCESS] Sequence length: {len(sequence)}")

        analysis_type = body.get('analysis_type', 'health')
        if analysis_type not in ['health', 'gene', 'early_screening']:
            logger.error(f"[VALIDATE] Invalid analysis type: {analysis_type}")
            raise HTTPException(status_code=400, detail="Invalid analysis type")

        include_recommendations = body.get('include_recommendations', True)
        include_risk_factors = body.get('include_risk_factors', True)
        include_metrics = body.get('include_metrics', True)

        result = await analyze_sequence(
            sequence=sequence,
            provider=provider,
            analysis_type=analysis_type,
            include_recommendations=include_recommendations,
            include_risk_factors=include_risk_factors,
            include_metrics=include_metrics
        )
        logger.info("[ANALYZE] Got result from analyze_sequence")
        logger.info(f"[ANALYZE] Result type: {type(result)}")
        
        if result and isinstance(result, dict) and 'analysis' in result:
            logger.info("[SUCCESS] Analysis completed successfully")
            return result
        else:
            logger.error(f"[ERROR] Invalid result format: {result}")
            raise HTTPException(status_code=500, detail="Invalid analysis result format")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Request processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
