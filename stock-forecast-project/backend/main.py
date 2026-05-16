"""
Stock Price Forecasting API - FastAPI Entry Point
Analytics Engine untuk prediksi harga saham menggunakan LSTM Deep Learning
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Stock Price Forecasting API",
    description="LSTM-based stock price prediction engine",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """API health status endpoint"""
    return {"status": "API is running", "version": "1.0.0"}

# Root endpoint
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
