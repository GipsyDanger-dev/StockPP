from api.routes import router as api_router
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stock Price Forecasting API",
    description="LSTM-based stock price prediction engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    """API health status endpoint"""
    return {"status": "API is running", "version": "1.0.0"}

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "Stock Price Forecasting API",
        "documentation": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
