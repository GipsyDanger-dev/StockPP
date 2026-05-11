"""
Stock Price Forecasting API - FastAPI Entry Point
Analytics Engine untuk prediksi harga saham menggunakan LSTM Deep Learning
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import threading

# Import routes and initialization
from api.routes import router as api_router, initialize_forecasting_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None

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

# Include API routes
app.include_router(api_router, prefix="/api/v1")

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

# Initialize services on startup
@app.on_event("startup")
async def startup_event():
    """Initialize services when app starts"""
    global scheduler
    
    logger.info("Starting up application...")
    try:
        # Initialize forecasting service
        initialize_forecasting_service()
        logger.info("Forecasting service initialized")
        
        # Initialize model scheduler
        try:
            from core.model_scheduler import ModelScheduler
            from core.retraining_orchestrator import RetrainingOrchestrator
            from core.model_manager import ModelManager
            
            # Create retraining callback
            def retrain_callback(tickers=None):
                """Callback for scheduled retraining"""
                logger.info(f"Starting scheduled retraining for tickers: {tickers}")
                model_manager = ModelManager()
                orchestrator = RetrainingOrchestrator(model_manager)
                result = orchestrator.batch_retrain(tickers=tickers, epochs=10)
                logger.info(f"Scheduled retraining complete. Summary: {result.get('summary')}")
                return result
            
            # Initialize scheduler
            scheduler = ModelScheduler(retraining_callback=retrain_callback)
            
            # Schedule retraining (example: Monday at 00:00, and daily at 02:00)
            scheduler.schedule_weekly_retrain(day="monday", time_str="00:00")
            scheduler.schedule_daily_retrain(time_str="02:00")
            
            # Start scheduler in background thread
            scheduler.start()
            logger.info("Model scheduler initialized and started")
            
            # Log scheduled jobs
            jobs_info = scheduler.get_scheduled_jobs_info()
            logger.info(f"Scheduled jobs: {jobs_info}")
            
        except Exception as e:
            logger.warning(f"Could not initialize scheduler: {str(e)}. Forecasting will still work.")
        
        logger.info("Application startup complete")
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup when app shuts down"""
    global scheduler
    
    logger.info("Shutting down application...")
    try:
        if scheduler:
            scheduler.stop()
            logger.info("Model scheduler stopped")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


