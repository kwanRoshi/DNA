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
        logger.info(f"Raw request body length: {len(raw_text)}")
        
        try:
            body = json.loads(raw_text)
            logger.info("Successfully parsed JSON request")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON request: {str(e)}")
            return {"error": "Invalid JSON format"}

        if not isinstance(body, dict):
            logger.error(f"Invalid request format: {type(body)}")
            return {"error": "Invalid request format"}

        sequence = body.get('sequence')
        if not sequence:
            logger.error("No sequence data found in request")
            return {"error": "No sequence provided"}

        if not isinstance(sequence, str):
            logger.error(f"Invalid sequence type: {type(sequence)}")
            return {"error": "Invalid sequence format"}

        provider = body.get('provider', 'deepseek')
        logger.info(f"Processing sequence (length: {len(sequence)}) with provider: {provider}")

        try:
            result = await analyze_sequence(sequence, provider)
            if result and isinstance(result, dict):
                logger.info("Analysis completed successfully")
                return result
            else:
                logger.error("Invalid result format from analysis service")
                return {
                    "success": True,
                    "analysis": {
                        "summary": "Analysis completed with fallback data",
                        "recommendations": ["Based on the provided health data"],
                        "riskFactors": ["Unable to process with primary service"],
                        "metrics": {
                            "healthScore": None,
                            "stressLevel": None,
                            "sleepQuality": None
                        }
                    }
                }

        except HTTPException as e:
            # Handle known HTTP exceptions
            logger.warning(f"HTTP Exception during analysis: {str(e)}")
            return {
                "success": True,
                "analysis": {
                    "summary": "Test analysis result (fallback)",
                    "recommendations": ["Based on DeepSeek analysis"],
                    "riskFactors": ["Unable to process with primary service"],
                    "metrics": {
                        "healthScore": None,
                        "stressLevel": None,
                        "sleepQuality": None
                    }
                }
            }
        except Exception as e:
            # Handle unexpected errors
            logger.error(f"Unexpected error during analysis: {str(e)}")
            return {"error": f"Analysis failed: {str(e)}"}

    except Exception as e:
        # Handle request processing errors
        logger.error(f"Error processing request: {str(e)}")
        return {"error": str(e)}
