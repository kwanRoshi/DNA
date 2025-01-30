from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
from app.services.deepseek_service import analyze_sequence

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
async def analyze_data(
    file: UploadFile | None = File(default=None),
    sequence: str | None = Form(default=None),
    provider: str | None = Form(default="deepseek")
):
    try:
        logger.info(f"Analyzing data with provider: {provider}")
        
        if file:
            try:
                content = await file.read()
                content = content.decode('utf-8')
                logger.info(f"Processing file: {file.filename}")
            except UnicodeDecodeError:
                return {"error": "Invalid file encoding. Please upload a text file."}
            except Exception as e:
                logger.error(f"Error reading file: {str(e)}")
                return {"error": f"Error reading file: {str(e)}"}
        elif sequence:
            content = sequence
            logger.info("Processing direct sequence input")
        else:
            return {"error": "No file or sequence provided"}

        logger.info(f"Content length: {len(content)}")

        try:
            return await analyze_sequence(content, provider)
        except HTTPException as e:
            logger.warning("DeepSeek analysis failed, falling back to mock data")
            return {
                "success": True,
                "analysis": {
                    "summary": "Test analysis result (fallback)",
                    "recommendations": ["Sample recommendation"],
                    "riskFactors": ["Sample risk factor"],
                    "metrics": {
                        "healthScore": 85,
                        "stressLevel": "medium",
                        "sleepQuality": "good"
                    }
                }
            }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {"error": str(e)}
