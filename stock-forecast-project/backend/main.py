from api.routes import router as api_router
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, LOG_LEVEL, logging.INFO))
logger = logging.getLogger(__name__)

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
VALIDATION_INTERVAL = int(os.getenv("VALIDATION_INTERVAL_HOURS", "6")) * 3600


async def auto_validate_predictions():
    """Background task: validate pending predictions every VALIDATION_INTERVAL hours."""
    while True:
        try:
            from core.supabase_client import get_pending_validations, update_prediction_validation
            from core.prediction_validator import validate_prediction

            pending = get_pending_validations(limit=50)
            if pending:
                logger.info(f"Auto-validating {len(pending)} pending predictions...")
                for pred in pending:
                    try:
                        result = validate_prediction(pred)
                        if "error" not in result:
                            update_prediction_validation(
                                pred_id=result["pred_id"],
                                actual_prices=result["actual_prices"],
                                actual_change_percent=result["actual_change_percent"],
                                direction_correct=result["direction_correct"],
                                mean_absolute_error=result["mean_absolute_error"],
                                mean_percent_error=result["mean_percent_error"]
                            )
                            logger.info(f"Validated {pred['ticker']} ({pred['id']}): MAPE={result['mean_percent_error']:.2f}%")
                    except Exception as e:
                        logger.warning(f"Failed to validate {pred.get('ticker', '?')}: {e}")
            else:
                logger.debug("No predictions pending validation")
        except Exception as e:
            logger.error(f"Auto-validation cycle failed: {e}")

        await asyncio.sleep(VALIDATION_INTERVAL)


@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(auto_validate_predictions())
    logger.info(f"Auto-validation scheduler started (every {VALIDATION_INTERVAL // 3600}h)")
    yield
    task.cancel()


app = FastAPI(
    title="Stock Price Forecasting API" if ENVIRONMENT == "development" else None,
    description="LSTM-based stock price prediction engine" if ENVIRONMENT == "development" else None,
    version="1.0.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url=None,
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

MAX_REQUEST_SIZE = 10 * 1024 * 1024


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    if request.headers.get("content-length") and int(request.headers["content-length"]) > MAX_REQUEST_SIZE:
        return JSONResponse(status_code=413, content={"detail": "Request too large"})
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "API is running", "version": "1.0.0"}


@app.get("/")
async def root():
    return {
        "message": "Stock Price Forecasting API",
        "documentation": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
