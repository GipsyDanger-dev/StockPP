"""
API Routes - Defines FastAPI endpoints for forecasting
"""

from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional, List
from pydantic import BaseModel
import numpy as np
import logging
from datetime import datetime, timedelta
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from core.forecasting_service import ForecastingService

logger = logging.getLogger(__name__)

# Pydantic models for request/response validation
class PredictionRequest(BaseModel):
    """Request model for stock prediction"""
    ticker: str
    days_ahead: int = 1
    period: str = "1y"
    
    class Config:
        json_schema_extra = {
            "example": {
                "ticker": "AAPL",
                "days_ahead": 5,
                "period": "1y"
            }
        }

class PricePoint(BaseModel):
    """Single price data point"""
    date: str
    price: float

class ForecastResponse(BaseModel):
    """API response for forecast"""
    ticker: str
    historical: List[PricePoint]
    forecast: List[PricePoint]
    metrics: dict
    trend: str
    timestamp: str

# Initialize router
router = APIRouter(tags=["forecasting"])

# Global forecasting service instance
_forecasting_service = None

def get_forecasting_service():
    """Get or create the forecasting service instance (lazy initialization)"""
    global _forecasting_service
    if _forecasting_service is None:
        try:
            logger.info("Initializing forecasting service...")
            _forecasting_service = ForecastingService()
            logger.info("Forecasting service initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing forecasting service: {str(e)}", exc_info=True)
            raise
    return _forecasting_service

def initialize_forecasting_service():
    """Initialize the forecasting service"""
    try:
        svc = get_forecasting_service()
        logger.info("Forecasting service ready")
    except Exception as e:
        logger.error(f"Error initializing forecasting service: {str(e)}", exc_info=True)
        raise

@router.post("/forecast")
async def forecast_stock(request: PredictionRequest):
    """
    Get stock price forecast
    
    Args:
        request: PredictionRequest with ticker, days_ahead, period
        
    Returns:
        ForecastResponse with historical, forecast, and metrics
    """
    try:
        service = get_forecasting_service()
        
        result = service.predict(
            ticker=request.ticker,
            days_ahead=request.days_ahead,
            period=request.period
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in forecast endpoint: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/forecast/{ticker}")
async def get_forecast_by_ticker(
    ticker: str = Path(..., description="Stock ticker symbol"),
    days: int = Query(1, ge=1, le=30, description="Days to forecast")
):
    """
    Get forecast for a specific ticker (simplified endpoint)
    
    Args:
        ticker: Stock ticker symbol
        days: Number of days to forecast (1-30)
        
    Returns:
        Forecast data
    """
    try:
        service = get_forecasting_service()
        
        request = PredictionRequest(ticker=ticker, days_ahead=days, period="1y")
        result = service.predict(
            ticker=ticker,
            days_ahead=days,
            period="1y"
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in get_forecast_by_ticker: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/validate/{ticker}")
async def validate_ticker(ticker: str = Path(..., description="Stock ticker symbol")):
    """
    Validate if ticker exists and data is available
    
    Args:
        ticker: Stock ticker to validate
        
    Returns:
        Validation result
    """
    try:
        service = get_forecasting_service()
        
        validation_result = service.validate_ticker(ticker)
        
        return {
            "ticker": ticker,
            "is_valid": validation_result["valid"], 
            "message": validation_result["message"], 
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error validating ticker: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/search/{query}")
async def search_tickers(query: str = Path(..., description="Search query")):
    """
    Search for stock tickers using Finnhub

    Args:
        query: Search query (company name or ticker symbol)

    Returns:
        List of matching tickers
    """
    try:
        from core.finnhub_client import FinnhubClient

        results = FinnhubClient.search_symbol(query)

        return {
            "query": query,
            "results": results,
            "total": len(results),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error searching tickers: {str(e)}")
        raise HTTPException(status_code=500, detail="Error searching tickers")


@router.get("/quote/{ticker}")
async def get_live_quote(ticker: str = Path(..., description="Stock ticker symbol")):
    """
    Get live price quote for any ticker

    Tries Finnhub first, falls back to yfinance for .JK stocks

    Args:
        ticker: Stock ticker symbol

    Returns:
        Live price data
    """
    try:
        from core.finnhub_client import FinnhubClient

        ticker_upper = ticker.upper()
        quote = None

        # Try Finnhub first
        quote = FinnhubClient.get_quote(ticker_upper)

        # Fallback to yfinance for unsupported tickers (e.g., .JK)
        if quote is None and ("." in ticker_upper or ticker_upper.endswith(".JK")):
            quote = FinnhubClient.get_quote_yfinance(ticker_upper)

        if quote is None:
            raise HTTPException(status_code=404, detail=f"No data found for ticker {ticker_upper}")

        return {
            "ticker": ticker_upper,
            "price": round(quote["current_price"], 2),
            "change": round(quote["change"], 2),
            "change_percent": round(quote["change_percent"], 2),
            "high": round(quote["high"], 2),
            "low": round(quote["low"], 2),
            "open": round(quote["open"], 2),
            "prev_close": round(quote["prev_close"], 2),
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quote for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching quote")


@router.get("/historical/{ticker}")
async def get_historical_data(
    ticker: str = Path(..., description="Stock ticker symbol"),
    days: int = Query(365, ge=30, le=3650, description="Number of days of history")
):
    """
    Get historical price data for a ticker

    Args:
        ticker: Stock ticker symbol
        days: Number of days of historical data

    Returns:
        Historical price data
    """
    try:
        service = get_forecasting_service()

        # Get data by making a prediction and returning just the historical data
        result = service.predict(ticker=ticker, days_ahead=1, period="1y")

        return {
            "ticker": ticker,
            "historical": result["historical"],
            "period_days": days,
            "timestamp": datetime.now().isoformat()
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting historical data: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/metrics/{ticker}")
async def get_model_metrics(ticker: str = Path(..., description="Stock ticker symbol")):
    """
    Get model performance metrics for a ticker
    
    Args:
        ticker: Stock ticker symbol
        
    Returns:
        Model evaluation metrics
    """
    try:
        service = get_forecasting_service()
        
        # Akses metrics melalui model_manager, bukan langsung dari forecasting_service
        ticker_upper = ticker.upper()
        if service.model_manager:
            metrics = service.model_manager.get_model_metrics(ticker_upper)
        else:
            metrics = None
        
        return {
            "ticker": ticker,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ============== Model Management Endpoints ==============

@router.post("/retrain/{ticker}")
async def trigger_retrain(ticker: str = Path(..., description="Stock ticker symbol")):
    """
    Manually trigger model retraining for a specific ticker
    
    Args:
        ticker: Stock ticker symbol
        
    Returns:
        Retraining job status
    """
    try:
        service = get_forecasting_service()
        
        # Get retraining orchestrator
        from core.retraining_orchestrator import RetrainingOrchestrator
        orchestrator = RetrainingOrchestrator(service.model_manager)
        
        # Start retraining
        result = orchestrator.retrain_model(
            ticker=ticker,
            force_retrain=True,
            epochs=10
        )
        
        return {
            "ticker": ticker,
            "job_started": True,
            "status": result.get("status"),
            "timestamp": datetime.now().isoformat(),
            "details": result
        }
        
    except Exception as e:
        logger.error(f"Error triggering retrain for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/retrain/status/{ticker}")
async def get_retrain_status(ticker: str = Path(..., description="Stock ticker symbol")):
    """
    Get retraining status and model info for a ticker
    
    Args:
        ticker: Stock ticker symbol
        
    Returns:
        Model status and metadata
    """
    try:
        service = get_forecasting_service()
        
        ticker_upper = ticker.upper()
        metrics = service.model_manager.get_model_metrics(ticker_upper)
        age = service.model_manager.get_model_age(ticker_upper)
        should_retrain = service.model_manager.should_retrain(ticker_upper)
        
        return {
            "ticker": ticker_upper,
            "model_exists": service.model_manager.model_exists(ticker_upper),
            "metrics": metrics,
            "age_hours": age,
            "should_retrain": should_retrain,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting retrain status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/models/status")
async def get_all_models_status():
    """
    Get status of all models
    
    Returns:
        Information about all models
    """
    try:
        service = get_forecasting_service()
        
        if not service.model_manager:
            return {
                "models": {},
                "total_models": 0,
                "timestamp": datetime.now().isoformat()
            }
        
        model_info = service.model_manager.get_all_model_info()
        
        return {
            "models": model_info,
            "total_models": len(model_info),
            "models_needing_retrain": sum(
                1 for info in model_info.values()
                if info.get("age_hours", 0) > 24
            ),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting models status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/batch-retrain")
async def trigger_batch_retrain(
    tickers: Optional[List[str]] = None,
    force: bool = False
):
    """
    Trigger batch retraining for multiple tickers
    
    Args:
        tickers: List of tickers to retrain (optional)
        force: Force retraining even if models are recent
        
    Returns:
        Batch retraining job status
    """
    try:
        service = get_forecasting_service()
        
        from core.retraining_orchestrator import RetrainingOrchestrator
        orchestrator = RetrainingOrchestrator(service.model_manager)
        
        result = orchestrator.batch_retrain(
            tickers=tickers,
            force_retrain=force,
            epochs=10
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in batch retrain: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ============== New Endpoints: Market & Reports (Supabase Integration) ==============

@router.get("/market/summary")
async def get_market_summary():
    """
    Get market summary with all active tickers and latest data

    Returns:
        List of tickers with current price and trend info
    """
    try:
        from core.supabase_client import get_all_tickers
        from core.finnhub_client import FinnhubClient

        # Get tickers from Supabase
        tickers_data = get_all_tickers()

        if not tickers_data:
            logger.warning("No tickers found in database, returning empty list")
            return {
                "tickers": [],
                "total": 0,
                "timestamp": datetime.now().isoformat()
            }

        market_data = []

        for ticker_info in tickers_data:
            try:
                ticker = ticker_info.get("symbol")

                # Fetch real-time price from Finnhub
                quote = FinnhubClient.get_quote(ticker)

                if quote is None:
                    continue

                market_data.append({
                    "ticker": ticker,
                    "name": ticker_info.get("name", ticker),
                    "sector": ticker_info.get("sector", "Unknown"),
                    "price": round(quote["current_price"], 2),
                    "change": round(quote["change"], 2),
                    "change_percent": round(quote["change_percent"], 2),
                    "high": round(quote["high"], 2),
                    "low": round(quote["low"], 2),
                    "open": round(quote["open"], 2),
                    "prev_close": round(quote["prev_close"], 2),
                    "is_active": ticker_info.get("is_active", True),
                    "last_trained": ticker_info.get("last_trained_at")
                })

            except Exception as e:
                logger.warning(f"Error fetching data for {ticker}: {str(e)}")
                continue

        return {
            "tickers": market_data,
            "total": len(market_data),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in market summary: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching market data")

@router.get("/reports/history")
async def get_reports_history(
    ticker: Optional[str] = Query(None, description="Filter by ticker"),
    limit: int = Query(50, ge=1, le=500, description="Maximum records to return"),
    status: Optional[str] = Query(None, description="Filter by status (Completed, Processing, Failed)")
):
    """
    Get training history and reports from Supabase
    
    Args:
        ticker: Optional ticker to filter by
        limit: Maximum number of records
        status: Optional status filter
        
    Returns:
        List of training reports
    """
    try:
        from core.supabase_client import get_training_logs, SupabaseClient
        
        # Get training logs from Supabase
        logs = get_training_logs(ticker=ticker, limit=limit)
        
        # Filter by status if provided
        if status:
            logs = [log for log in logs if log.get("status") == status]
        
        # Format response
        reports = []
        for log in logs:
            reports.append({
                "id": log.get("id"),
                "ticker": log.get("ticker"),
                "report_name": log.get("report_name"),
                "rmse": round(float(log.get("rmse", 0)), 4),
                "mae": round(float(log.get("mae", 0)), 4),
                "r_square": round(float(log.get("r_square", 0)), 4) if log.get("r_square") else None,
                "accuracy": round(float(log.get("accuracy", 0)), 4) if log.get("accuracy") else None,
                "status": log.get("status"),
                "created_at": log.get("created_at"),
                "training_samples": log.get("training_samples")
            })
        
        return {
            "reports": reports,
            "total": len(reports),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in reports history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching reports")

@router.get("/health/database")
async def health_check_database():
    """
    Check if Supabase database connection is healthy
    
    Returns:
        Database health status
    """
    try:
        from core.supabase_client import SupabaseClient
        
        client = SupabaseClient.get_client()
        
        # Simple query to test connection
        result = client.table("tickers").select("count").limit(1).execute()
        
        return {
            "database": "connected",
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "database": "disconnected",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ============== Insights Endpoint ==============

@router.get("/insights")
async def get_insights():
    """
    Get AI-driven market insights based on trained models and market data
    
    Returns:
        Dynamic insights with featured article, insight cards, and summary
    """
    try:
        service = get_forecasting_service()
        
        from core.insight_engine import InsightEngine
        engine = InsightEngine(service.model_manager)
        
        insights = engine.get_all_insights()
        
        return insights
        
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}", exc_info=True)
        return {
            "featured": {
                "title": "Insights Temporarily Unavailable",
                "summary": "We're experiencing issues generating insights. Please try again later.",
                "category": "System",
                "date": datetime.now().strftime("%b %d, %Y"),
                "read_time": "1 min read"
            },
            "insights": [],
            "summary": {
                "total_models": 0,
                "models_needing_retrain": 0,
                "avg_rmse": 0,
                "recommendation": "System recovering"
            },
            "timestamp": datetime.now().isoformat()
        }

# ============== End of Routes ==============
