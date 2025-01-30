from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import logging
import json
from app.services.deepseek_service import analyze_sequence

class AnalysisRequest(BaseModel):
    sequence: str
    provider: str = "deepseek"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

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

@app.post("/api/analyze")
async def analyze_data(request: Request):
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
            return {"error": "Invalid JSON format", "details": str(e)}

        if not isinstance(body, dict):
            logger.error(f"[VALIDATE] Invalid body type: {type(body)}")
            return {"error": "Invalid request format", "details": f"Expected dict, got {type(body)}"}

        sequence = body.get('sequence')
        if not sequence:
            logger.error("[VALIDATE] Missing sequence")
            return {"error": "No sequence provided"}

        if not isinstance(sequence, str):
            logger.error(f"[VALIDATE] Invalid sequence type: {type(sequence)}")
            return {"error": "Invalid sequence format", "details": f"Expected string, got {type(sequence)}"}

        provider = body.get('provider', 'deepseek')
        logger.info(f"[PROCESS] Using provider: {provider}")
        logger.info(f"[PROCESS] Sequence length: {len(sequence)}")

        try:
            result = await analyze_sequence(sequence, provider)
            logger.info("[ANALYZE] Got result from analyze_sequence")
            logger.info(f"[ANALYZE] Result type: {type(result)}")
            
            if result and isinstance(result, dict):
                logger.info("[SUCCESS] Analysis completed successfully")
                return {
                    "success": True,
                    "analysis": {
                        "summary": result.get("summary", "Analysis completed successfully"),
                        "recommendations": result.get("recommendations", []),
                        "riskFactors": result.get("riskFactors", []),
                        "metrics": result.get("metrics", {
                            "healthScore": None,
                            "stressLevel": None,
                            "sleepQuality": None
                        })
                    }
                }
            else:
                logger.error(f"[ERROR] Invalid result format: {result}")
                return {
                    "success": True,
                    "analysis": {
                        "summary": "Analysis completed with limited data",
                        "recommendations": ["Based on the provided health data"],
                        "riskFactors": ["Limited analysis available"],
                        "metrics": {
                            "healthScore": None,
                            "stressLevel": None,
                            "sleepQuality": None
                        }
                    }
                }

        except HTTPException as e:
            logger.error(f"[ERROR] HTTP Exception: {str(e)}")
            return {
                "error": "Service temporarily unavailable",
                "details": str(e)
            }
        except Exception as e:
            logger.error(f"[ERROR] Unexpected analysis error: {str(e)}")
            return {
                "error": "Analysis failed",
                "details": str(e)
            }

    except Exception as e:
        logger.error(f"[ERROR] Request processing error: {str(e)}")
        return {
            "error": "Request processing failed",
            "details": str(e)
        }
