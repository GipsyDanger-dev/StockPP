from fastapi import APIRouter, HTTPException, Query, Path, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
import logging
from datetime import datetime
import secrets
import time
import json
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from core.forecasting_service import ForecastingService
from core.progress_emitter import ProgressEmitter
from core.supabase_client import create_otp, verify_otp, cleanup_expired_otps, reset_user_password, set_user_role, list_users, get_user_predictions, get_pending_validations, update_prediction_validation, check_otp_rate_limit, record_otp_attempt
from core.otp_service import send_otp
from core.auth import get_current_user, require_admin, get_current_user_from_query

logger = logging.getLogger(__name__)


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
    reset_token: str

class PredictionRequest(BaseModel):
    """Request model for stock prediction"""
    ticker: str
    days_ahead: int = 1
    period: str = "5y"
    user_id: Optional[str] = None

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "ticker": "AAPL",
            "days_ahead": 5,
            "period": "1y"
        }
    })

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

router = APIRouter(tags=["forecasting"])

_reset_tokens = {}  # email -> (token, expiry_timestamp)


@router.post("/auth/send-otp")
async def send_otp_endpoint(request: SendOtpRequest):
    try:
        if request.delivery_method == "whatsapp" and not request.phone_number:
            raise HTTPException(
                status_code=400,
                detail="Phone number is required for WhatsApp delivery"
            )

        if request.delivery_method not in ["email", "whatsapp"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid delivery method. Use 'email' or 'whatsapp'"
            )

        otp_data = create_otp(
            email=request.email,
            delivery_method=request.delivery_method,
            phone_number=request.phone_number
        )

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
    try:
        if not check_otp_rate_limit(request.email):
            raise HTTPException(
                status_code=429,
                detail="Too many attempts. Please try again later."
            )

        if len(request.code) != 6 or not request.code.isdigit():
            raise HTTPException(
                status_code=400,
                detail="Invalid OTP format. Must be 6 digits."
            )

        is_valid = verify_otp(email=request.email, code=request.code)

        if not is_valid:
            record_otp_attempt(request.email)
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OTP code"
            )

        reset_token = secrets.token_urlsafe(32)
        _reset_tokens[request.email] = (reset_token, time.time() + 900)

        return {
            "success": True,
            "message": "OTP verified successfully",
            "email": request.email,
            "reset_token": reset_token
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in verify-otp: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/auth/reset-password")
async def reset_password_endpoint(request: ResetPasswordRequest):
    try:
        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters"
            )

        stored = _reset_tokens.get(request.email)
        if not stored or not secrets.compare_digest(stored[0], request.reset_token) or time.time() > stored[1]:
            raise HTTPException(
                status_code=403,
                detail="Invalid or expired reset token. Please verify your code again."
            )

        del _reset_tokens[request.email]

        result = reset_user_password(request.email, request.new_password)

        if not result["success"]:
            raise HTTPException(
                status_code=500,
                detail=result["message"]
            )

        return {
            "success": True,
            "message": "Password reset successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in reset-password: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


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

@router.post("/forecast")
async def forecast_stock(request: PredictionRequest, user: dict = Depends(get_current_user)):
    try:
        service = get_forecasting_service()

        result = service.predict(
            ticker=request.ticker,
            days_ahead=request.days_ahead,
            period=request.period,
            user_id=user["id"]
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in forecast endpoint: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/forecast/stream")
async def forecast_stream(
    ticker: str = Query(..., description="Stock ticker symbol"),
    days_ahead: int = Query(7, ge=1, le=30, description="Days to forecast"),
    period: str = Query("1y", description="Historical data period"),
    token: str = Query(..., description="Auth token"),
):
    """SSE endpoint that streams forecast progress in real-time."""
    user = await get_current_user_from_query(token)
    service = get_forecasting_service()

    loop = asyncio.get_event_loop()
    queue = asyncio.Queue()
    emitter = ProgressEmitter(queue, loop)

    async def run_forecast():
        try:
            await loop.run_in_executor(
                None,
                lambda: service.predict(
                    ticker=ticker,
                    days_ahead=days_ahead,
                    period=period,
                    user_id=user["id"],
                    progress=emitter
                )
            )
        except Exception as e:
            logger.error(f"SSE forecast error: {e}")
            await emitter.error(str(e))
        finally:
            await queue.put(None)

    asyncio.create_task(run_forecast())

    async def event_generator():
        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"event: {item['event']}\ndata: {json.dumps(item['data'])}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/forecast/{ticker}")
async def get_forecast_by_ticker(
    ticker: str = Path(..., description="Stock ticker symbol"),
    days: int = Query(1, ge=1, le=30, description="Days to forecast"),
    user: dict = Depends(get_current_user),
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
    days: int = Query(365, ge=30, le=3650, description="Number of days of history"),
    user: dict = Depends(get_current_user),
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
async def get_model_metrics(ticker: str = Path(..., description="Stock ticker symbol"), user: dict = Depends(get_current_user)):
    """
    Get model performance metrics for a ticker

    Args:
        ticker: Stock ticker symbol

    Returns:
        Model evaluation metrics
    """
    try:
        service = get_forecasting_service()

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


@router.post("/retrain/{ticker}")
async def trigger_retrain(ticker: str = Path(..., description="Stock ticker symbol"), user: dict = Depends(require_admin)):
    """
    Manually trigger model retraining for a specific ticker

    Args:
        ticker: Stock ticker symbol

    Returns:
        Retraining job status
    """
    try:
        service = get_forecasting_service()

        from core.retraining_orchestrator import RetrainingOrchestrator
        orchestrator = RetrainingOrchestrator(service.model_manager)

        result = orchestrator.retrain_model(
            ticker=ticker,
            force_retrain=True,
            epochs=50,
            period="5y"
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


@router.get("/retrain/stream/{ticker}")
async def retrain_stream(
    ticker: str = Path(..., description="Stock ticker symbol"),
    token: str = Query(..., description="Auth token"),
    epochs: int = Query(50, ge=10, le=200, description="Training epochs"),
):
    """SSE endpoint that streams retraining progress in real-time. Admin only."""
    user = await get_current_user_from_query(token)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    service = get_forecasting_service()
    loop = asyncio.get_event_loop()
    queue = asyncio.Queue()
    emitter = ProgressEmitter(queue, loop)

    async def run_retrain():
        try:
            from core.retraining_orchestrator import RetrainingOrchestrator
            orchestrator = RetrainingOrchestrator(service.model_manager)
            await loop.run_in_executor(
                None,
                lambda: orchestrator.retrain_model(
                    ticker=ticker,
                    force_retrain=True,
                    epochs=epochs,
                    period="5y",
                    progress=emitter
                )
            )
        except Exception as e:
            logger.error(f"SSE retrain error: {e}")
            await emitter.error(str(e))
        finally:
            await queue.put(None)

    asyncio.create_task(run_retrain())

    async def event_generator():
        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"event: {item['event']}\ndata: {json.dumps(item['data'])}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/retrain/status/{ticker}")
async def get_retrain_status(ticker: str = Path(..., description="Stock ticker symbol"), user: dict = Depends(get_current_user)):
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
async def get_all_models_status(user: dict = Depends(get_current_user)):
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
    force: bool = False,
    user: dict = Depends(require_admin),
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
            epochs=50
        )

        return result

    except Exception as e:
        logger.error(f"Error in batch retrain: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/market/summary")
async def get_market_summary(user: dict = Depends(get_current_user)):
    """
    Get market summary with all active tickers and latest data

    Returns:
        List of tickers with current price and trend info
    """
    import asyncio
    from concurrent.futures import ThreadPoolExecutor
    try:
        from core.supabase_client import get_all_tickers
        from core.finnhub_client import FinnhubClient

        tickers_data = get_all_tickers()

        if not tickers_data:
            logger.warning("No tickers found in database, returning empty list")
            return {
                "tickers": [],
                "total": 0,
                "timestamp": datetime.now().isoformat()
            }

        def fetch_quote(ticker_info):
            ticker = ticker_info.get("symbol")
            try:
                quote = FinnhubClient.get_quote(ticker)
                if quote is None:
                    return None
                return {
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
                }
            except Exception as e:
                logger.warning(f"Error fetching data for {ticker}: {str(e)}")
                return None

        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor(max_workers=10) as pool:
            tasks = [loop.run_in_executor(pool, fetch_quote, ti) for ti in tickers_data]
            results = await asyncio.gather(*tasks)

        market_data = [r for r in results if r is not None]

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
    status: Optional[str] = Query(None, description="Filter by status (Completed, Processing, Failed)"),
    user: dict = Depends(get_current_user),
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
        from core.supabase_client import get_training_logs

        logs = get_training_logs(ticker=ticker, limit=limit)

        if status:
            logs = [log for log in logs if log.get("status") == status]

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
async def health_check_database(user: dict = Depends(get_current_user)):
    """
    Check if Supabase database connection is healthy

    Returns:
        Database health status
    """
    try:
        from core.supabase_client import SupabaseClient

        client = SupabaseClient.get_client()

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
    image_type: Optional[str] = Query("general", description="Image type: header, thumbnail, inline, general"),
    user: dict = Depends(require_admin),
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

@router.get("/articles/stats")
async def get_article_statistics(user: dict = Depends(get_current_user)):
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
async def create_article(request: ArticleRequest, user: dict = Depends(require_admin)):
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
    request: ArticleUpdateRequest = None,
    user: dict = Depends(require_admin),
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

        existing = get_article_by_id(article_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Article not found")

        updates = {}
        for field, value in request.model_dump(exclude_unset=True).items():
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
async def delete_article(article_id: str = Path(..., description="Article ID"), user: dict = Depends(require_admin)):
    """
    Delete an article

    Args:
        article_id: Article UUID

    Returns:
        Deletion status
    """
    try:
        from core.supabase_client import delete_article as db_delete, get_article_by_id

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

@router.get("/insights")
async def get_insights(user: dict = Depends(get_current_user)):
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


class SetRoleRequest(BaseModel):
    user_id: str
    role: str  # 'admin' or 'user'

@router.get("/users")
async def get_users(user: dict = Depends(require_admin)):
    result = list_users()
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])
    return result

@router.post("/users/set-role")
async def set_role(request: SetRoleRequest, user: dict = Depends(require_admin)):
    """Set a user's role (admin only)"""
    result = set_user_role(request.user_id, request.role)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.get("/predictions/history")
async def get_predictions_history(
    ticker: Optional[str] = Query(None, description="Filter by ticker"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    predictions = get_user_predictions(user["id"], ticker=ticker, status=status, limit=limit)
    return {"predictions": predictions, "total": len(predictions)}

@router.post("/predictions/validate/{prediction_id}")
async def validate_single_prediction(prediction_id: str, user: dict = Depends(get_current_user)):
    """Validate a single prediction against actual prices"""
    from core.prediction_validator import validate_prediction

    from core.supabase_client import SupabaseClient
    client = SupabaseClient.get_client()
    result = client.table("prediction_history").select("*").eq("id", prediction_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Prediction not found")

    prediction = result.data[0]

    if prediction.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to validate this prediction")

    validation = validate_prediction(prediction)

    if "error" in validation:
        raise HTTPException(status_code=400, detail=validation["error"])

    updated = update_prediction_validation(
        pred_id=prediction_id,
        actual_prices=validation["actual_prices"],
        actual_change_percent=validation["actual_change_percent"],
        direction_correct=validation["direction_correct"],
        mean_absolute_error=validation["mean_absolute_error"],
        mean_percent_error=validation["mean_percent_error"]
    )

    return {"status": "validated", "validation": validation, "updated": updated}

@router.post("/predictions/validate-all")
async def validate_all_predictions(user: dict = Depends(require_admin)):
    """Batch validate all pending predictions"""
    from core.prediction_validator import validate_prediction

    pending = get_pending_validations(limit=50)

    if not pending:
        return {"status": "no_pending", "message": "No predictions pending validation"}

    results = {"total": len(pending), "validated": 0, "failed": 0, "details": []}

    for pred in pending:
        validation = validate_prediction(pred)
        if "error" in validation:
            results["failed"] += 1
            results["details"].append({
                "pred_id": pred.get("id"),
                "ticker": pred.get("ticker"),
                "status": "failed",
                "error": validation["error"]
            })
        else:
            update_prediction_validation(
                pred_id=pred["id"],
                actual_prices=validation["actual_prices"],
                actual_change_percent=validation["actual_change_percent"],
                direction_correct=validation["direction_correct"],
                mean_absolute_error=validation["mean_absolute_error"],
                mean_percent_error=validation["mean_percent_error"]
            )
            results["validated"] += 1
            results["details"].append({
                "pred_id": pred["id"],
                "ticker": pred.get("ticker"),
                "status": "validated",
                "mae": validation["mean_absolute_error"],
                "mpe": validation["mean_percent_error"],
                "direction_correct": validation["direction_correct"]
            })

    return results
