"""
API Routes - Defines FastAPI endpoints for forecasting and OTP
"""

from fastapi import APIRouter, HTTPException, Query, Path, UploadFile, File
from typing import Optional, List
from pydantic import BaseModel, EmailStr
import numpy as np
import logging
from datetime import datetime, timedelta
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from core.forecasting_service import ForecastingService
from core.supabase_client import create_otp, verify_otp, cleanup_expired_otps
from core.otp_service import send_otp

logger = logging.getLogger(__name__)

# ============== OTP Request/Response Models ==============

class SendOtpRequest(BaseModel):
    email: EmailStr
    delivery_method: str = "email"  # 'email' or 'whatsapp'
    phone_number: Optional[str] = None  # Required if delivery_method is 'whatsapp'

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

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

# ============== OTP Endpoints ==============

@router.post("/auth/send-otp")
async def send_otp_endpoint(request: SendOtpRequest):
    """
    Send OTP code via email or WhatsApp for password reset

    Args:
        request: Contains email, delivery_method, and optional phone_number

    Returns:
        Success message with delivery method used
    """
    try:
        # Validate WhatsApp requires phone number
        if request.delivery_method == "whatsapp" and not request.phone_number:
            raise HTTPException(
                status_code=400,
                detail="Phone number is required for WhatsApp delivery"
            )

        # Validate delivery method
        if request.delivery_method not in ["email", "whatsapp"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid delivery method. Use 'email' or 'whatsapp'"
            )

        # Create OTP in database
        otp_data = create_otp(
            email=request.email,
            delivery_method=request.delivery_method,
            phone_number=request.phone_number
        )

        # Send OTP via chosen method
        success = await send_otp(
            email=request.email,
            code=otp_data["code"],
            delivery_method=request.delivery_method,
            phone_number=request.phone_number
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send OTP. Please try again."
            )

        # Clean up expired OTPs (best effort)
        try:
            cleanup_expired_otps()
        except Exception:
            pass

        return {
            "success": True,
            "message": f"OTP sent via {request.delivery_method}",
            "delivery_method": request.delivery_method,
            "expires_in": 300  # 5 minutes in seconds
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send-otp: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/auth/verify-otp")
async def verify_otp_endpoint(request: VerifyOtpRequest):
    """
    Verify OTP code for password reset

    Args:
        request: Contains email and code

    Returns:
        Success status if code is valid
    """
    try:
        if len(request.code) != 6 or not request.code.isdigit():
            raise HTTPException(
                status_code=400,
                detail="Invalid OTP format. Must be 6 digits."
            )

        is_valid = verify_otp(email=request.email, code=request.code)

        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OTP code"
            )

        return {
            "success": True,
            "message": "OTP verified successfully",
            "email": request.email
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in verify-otp: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


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

# ============== Article/Insight Endpoints ==============

class ArticleRequest(BaseModel):
    """Request model for creating/updating articles"""
    title: str
    content: str
    category: str = "Market Analysis"
    summary: str = ""
    author: str = "Admin"
    status: str = "draft"
    image_url: Optional[str] = None
    header_image: Optional[str] = None
    thumbnail: Optional[str] = None
    tags: Optional[List[str]] = []

class ArticleUpdateRequest(BaseModel):
    """Request model for updating articles"""
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    header_image: Optional[str] = None
    thumbnail: Optional[str] = None
    tags: Optional[List[str]] = None

@router.get("/articles")
async def get_articles(
    status: Optional[str] = Query(None, description="Filter by status (draft, published)"),
    limit: int = Query(50, ge=1, le=200, description="Maximum records")
):
    """
    Get all articles

    Args:
        status: Optional status filter
        limit: Maximum records

    Returns:
        List of articles
    """
    try:
        from core.supabase_client import get_all_articles, get_article_stats

        articles = get_all_articles(status=status, limit=limit)
        stats = get_article_stats()

        return {
            "articles": articles,
            "total": len(articles),
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error fetching articles: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching articles")

@router.post("/articles/upload-image")
async def upload_article_image_endpoint(
    file: UploadFile = File(...),
    article_id: Optional[str] = Query(None, description="Article ID for organizing images"),
    image_type: Optional[str] = Query("general", description="Image type: header, thumbnail, inline, general")
):
    """
    Upload an image for an article
    """
    try:
        from core.supabase_client import upload_article_image

        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )

        file_content = await file.read()
        if len(file_content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max size: 5MB")

        url = upload_article_image(
            file_content=file_content,
            file_name=file.filename or "image.jpg",
            article_id=article_id,
            image_type=image_type
        )

        return {
            "url": url,
            "filename": file.filename,
            "image_type": image_type,
            "size": len(file_content)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail="Error uploading image")

@router.get("/articles/{article_id}")
async def get_article(article_id: str = Path(..., description="Article ID")):
    """
    Get a single article by ID

    Args:
        article_id: Article UUID

    Returns:
        Article data
    """
    try:
        from core.supabase_client import get_article_by_id

        article = get_article_by_id(article_id)

        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        return article

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching article: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching article")

@router.post("/articles")
async def create_article(request: ArticleRequest):
    """
    Create a new article

    Args:
        request: Article data

    Returns:
        Created article
    """
    try:
        from core.supabase_client import create_article

        article = create_article(
            title=request.title,
            content=request.content,
            category=request.category,
            summary=request.summary,
            author=request.author,
            status=request.status,
            image_url=request.image_url,
            header_image=request.header_image,
            thumbnail=request.thumbnail,
            tags=request.tags
        )

        return article

    except Exception as e:
        logger.error(f"Error creating article: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating article")

@router.put("/articles/{article_id}")
async def update_article(
    article_id: str = Path(..., description="Article ID"),
    request: ArticleUpdateRequest = None
):
    """
    Update an existing article

    Args:
        article_id: Article UUID
        request: Fields to update

    Returns:
        Updated article
    """
    try:
        from core.supabase_client import update_article as db_update, get_article_by_id

        # Check if article exists
        existing = get_article_by_id(article_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Article not found")

        # Build update dict (only non-None fields)
        updates = {}
        for field, value in request.dict(exclude_unset=True).items():
            if value is not None:
                updates[field] = value

        if not updates:
            return existing

        updated = db_update(article_id, updates)
        return updated

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating article: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating article")

@router.delete("/articles/{article_id}")
async def delete_article(article_id: str = Path(..., description="Article ID")):
    """
    Delete an article

    Args:
        article_id: Article UUID

    Returns:
        Deletion status
    """
    try:
        from core.supabase_client import delete_article as db_delete, get_article_by_id

        # Check if article exists
        existing = get_article_by_id(article_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Article not found")

        success = db_delete(article_id)

        if success:
            return {"message": "Article deleted successfully", "id": article_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete article")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting article: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting article")

@router.get("/articles/stats")
async def get_article_statistics():
    """
    Get article statistics

    Returns:
        Article counts by status
    """
    try:
        from core.supabase_client import get_article_stats

        stats = get_article_stats()

        return {
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error fetching article stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching stats")

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
