# Automatic Model Retraining System

## Overview

This document describes the automated model retraining infrastructure with three key components:
1. **Persistence** - Model loading/caching for reduced latency
2. **Trigger** - Scheduled retraining at specified intervals
3. **Validation** - Model comparison and quality assurance

---

## Architecture Components

### 1. ModelManager (backend/core/model_manager.py)

**Purpose:** Lifecycle management for trained LSTM models

**Key Features:**
- **Persistence**: Save/load models in TensorFlow .keras format
- **Versioning**: Keep last 5 versions per ticker for rollback
- **Validation**: Compare RMSE with 2% tolerance threshold
- **Metadata**: JSON tracking of all model versions with timestamps

**Key Methods:**
```python
save_model(model, ticker, metrics)      # Save new model with metrics
load_model(ticker)                      # Lazy load pre-trained model
validate_model_improvement(old, new)    # Check if new is better/equal
should_retrain(ticker)                  # Check if model too old (>24hrs)
get_model_metrics(ticker)               # Retrieve current RMSE/MAE
get_model_age(ticker)                   # Hours since last training
model_exists(ticker)                    # Check if trained model exists
```

**Storage Structure:**
```
saved_models/
  ├── AAPL.keras             # Latest model for AAPL
  ├── AAPL_v1.keras          # Version history
  ├── AAPL_v2.keras
  ├── MSFT.keras
  └── model_metadata.json     # Metadata tracking all versions
```

---

### 2. ModelScheduler (backend/core/model_scheduler.py)

**Purpose:** Schedule periodic retraining tasks in background

**Key Features:**
- **Thread-based execution**: Runs in background without blocking API
- **Multiple schedule types**: Weekly, daily, or fixed intervals
- **Job tracking**: Monitor next run times and task status
- **Graceful shutdown**: Cleanup resources on app exit

**Usage Example:**
```python
# Initialize scheduler with callback
def retrain_callback(tickers=None):
    orchestrator = RetrainingOrchestrator()
    return orchestrator.batch_retrain(tickers=tickers)

scheduler = ModelScheduler(retraining_callback=retrain_callback)

# Schedule retraining
scheduler.schedule_weekly_retrain(day="monday", time_str="00:00")
scheduler.schedule_daily_retrain(time_str="02:00")
scheduler.schedule_periodic_retrain(interval_hours=12)

# Start background thread
scheduler.start()
```

**Scheduled Tasks in Current Setup:**
- Every Monday at 00:00 UTC - Weekly comprehensive retrain
- Every day at 02:00 UTC - Daily quick retrain of models needing update

---

### 3. RetrainingOrchestrator (backend/core/retraining_orchestrator.py)

**Purpose:** Orchestrate complete model retraining workflow

**Key Features:**
- **Data fetching**: Retrieve fresh stock data from yfinance
- **Training**: Build and train new LSTM models
- **Validation**: Compare with existing model using RMSE
- **Batch processing**: Retrain multiple tickers efficiently
- **Status reporting**: Detailed results for each retraining job

**Key Methods:**
```python
retrain_model(ticker)        # Single model retraining with validation
batch_retrain(tickers)       # Retrain multiple models
get_retraining_status()      # Check status of all models
```

**Retraining Workflow:**
```
1. Check if model needs retraining (age > 24 hours)
2. Fetch fresh yfinance data for ticker
3. Prepare data: normalize with MinMaxScaler
4. Create 60-day sliding window sequences
5. Split 80/20 train/test
6. Build and train LSTM model (10 epochs)
7. Evaluate on test set (calculate RMSE, MAE)
8. Compare RMSE with existing model (2% tolerance)
9. If better/equal: save new model
10. Log results and metrics
```

---

## Integration with ForecastingService

The ForecastingService now includes:

1. **Lazy Model Loading**: Checks if trained model exists, loads instead of mock data
2. **Caching**: Reduces API latency for repeated requests
3. **Fallback to Mock**: Uses mock forecast if model not available
4. **Model Metrics**: Returns real metrics from ModelManager

```python
# In ForecastingService.predict():
if model_manager.model_exists(ticker):
    model = model_manager.load_model(ticker)  # Load persisted model
    # Use real model for forecasting
else:
    return _generate_mock_forecast(ticker)    # Fallback to mock
```

---

## API Endpoints for Model Management

### 1. Trigger Manual Retrain
```
POST /api/v1/retrain/{ticker}
```
Manually trigger retraining for a specific ticker
```json
{
  "ticker": "AAPL",
  "job_started": true,
  "status": "success",
  "details": {
    "old_metrics": {"rmse": 2.5, "mae": 1.8},
    "new_metrics": {"rmse": 2.3, "mae": 1.7},
    "model_saved": true
  }
}
```

### 2. Check Retrain Status
```
GET /api/v1/retrain/status/{ticker}
```
Get model status and metadata
```json
{
  "ticker": "AAPL",
  "model_exists": true,
  "metrics": {"rmse": 2.3, "mae": 1.7},
  "age_hours": 12,
  "should_retrain": false
}
```

### 3. Get All Models Status
```
GET /api/v1/models/status
```
Get comprehensive status of all trained models
```json
{
  "total_models": 5,
  "models_needing_retrain": 2,
  "models": {
    "AAPL": {"age_hours": 12, "rmse": 2.3},
    "MSFT": {"age_hours": 48, "rmse": 2.8}
  }
}
```

### 4. Batch Retrain
```
POST /api/v1/batch-retrain
```
Trigger retraining for multiple tickers
```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL"],
  "force": false
}
```

---

## Validation Logic

### RMSE Comparison with Tolerance

The system uses a 2% tolerance threshold to determine if a new model is acceptable:

```python
def validate_model_improvement(old_metrics, new_metrics):
    old_rmse = old_metrics.get("rmse", float('inf'))
    new_rmse = new_metrics.get("rmse")
    
    tolerance = old_rmse * 0.02  # 2% tolerance
    
    # Accept if new model is better or within 2% tolerance
    return new_rmse <= (old_rmse + tolerance)
```

**Behavior:**
- If no old model exists: Save new model automatically
- If new RMSE < old RMSE: Always save (improvement)
- If new RMSE <= old RMSE + 2%: Save (acceptable)
- If new RMSE > old RMSE + 2%: Skip saving (degradation)

---

## Initialization in main.py

The scheduler is automatically initialized on app startup:

```python
@app.on_event("startup")
async def startup_event():
    # Initialize forecasting service
    initialize_forecasting_service()
    
    # Initialize model scheduler
    scheduler = ModelScheduler(retraining_callback=retrain_callback)
    
    # Schedule tasks
    scheduler.schedule_weekly_retrain(day="monday", time_str="00:00")
    scheduler.schedule_daily_retrain(time_str="02:00")
    
    # Start background thread
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.stop()  # Cleanup on exit
```

---

## Monitoring and Logging

All retraining activities are logged with detailed information:

```log
2024-01-15 00:00:00 - INFO - Starting retraining for AAPL
2024-01-15 00:00:01 - INFO - Fetching data for AAPL...
2024-01-15 00:00:03 - INFO - Data split - Train: 160, Test: 40
2024-01-15 00:00:05 - INFO - Training model (10 epochs)...
2024-01-15 00:00:45 - INFO - Model evaluation - RMSE: 2.3, MAE: 1.7
2024-01-15 00:00:46 - INFO - Validating model improvement...
2024-01-15 00:00:47 - INFO - Model successfully retrained and saved for AAPL
```

---

## Performance Optimization

### 1. Lazy Loading
Models are loaded only when needed, reducing startup time

### 2. Caching
Forecasts are cached for 1 hour to reduce repeated API calls

### 3. Batch Processing
Multiple models are retrained in single batch to optimize resources

### 4. Configurable Training
- Default epochs: 10 (can be adjusted)
- Batch size: 32
- Train/test split: 80/20

---

## Configuration

To customize retraining schedules, modify main.py:

```python
# Change retraining schedule
scheduler.schedule_weekly_retrain(day="sunday", time_str="06:00")  # Sunday 6 AM
scheduler.schedule_daily_retrain(time_str="14:00")                 # Daily 2 PM
scheduler.schedule_periodic_retrain(interval_hours=6)              # Every 6 hours

# Change retraining parameters in orchestrator
result = orchestrator.retrain_model(ticker, epochs=20, period="2y")
```

---

## Error Handling

The system handles various error scenarios:

1. **Insufficient Data**: Uses mock forecast if < 70 data points available
2. **Model Load Failure**: Falls back to mock forecast
3. **Training Error**: Logs error and skips model save
4. **Scheduler Error**: Continues running, logs warning

---

## Testing the System

### Manual Endpoint Test
```bash
# Trigger retrain for AAPL
curl -X POST http://localhost:8000/api/v1/retrain/AAPL

# Check model status
curl http://localhost:8000/api/v1/models/status

# Batch retrain
curl -X POST http://localhost:8000/api/v1/batch-retrain \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL", "MSFT"]}'
```

### Verify Scheduler in Logs
Check backend logs for:
- "Model scheduler initialized and started"
- "Scheduled jobs: [...]"
- "Starting retraining for {ticker}" at scheduled times

---

## Future Enhancements

1. **Database Integration**: Store model metrics in PostgreSQL for analytics
2. **Distributed Training**: Use Celery for parallel retraining
3. **Performance Dashboard**: Web UI showing retraining status
4. **Alert System**: Email/Slack notifications for failed retraining
5. **A/B Testing**: Compare multiple model versions before deployment

---

## Files Modified/Created

### New Files
- `backend/core/model_manager.py` (330+ lines)
- `backend/core/model_scheduler.py` (200+ lines)
- `backend/core/retraining_orchestrator.py` (270+ lines)
- `backend/api/routes.py` - Added 4 new endpoints (100+ lines)

### Modified Files
- `backend/core/forecasting_service.py` - Added model persistence integration
- `backend/main.py` - Added scheduler initialization
- `backend/requirements.txt` - Added `schedule==1.2.0`

### Configuration
- `saved_models/` - Directory for storing trained models and metadata

---

## Summary

The automatic retraining system ensures models stay updated with fresh data while maintaining quality validation. The three components work together to:

✅ **Persistence** - Reduce latency by loading pre-trained models
✅ **Trigger** - Automatically retrain at specified intervals
✅ **Validation** - Compare RMSE to ensure model improvement

This implements the full Indonesian requirement:
> "Gunakan `load_model()` untuk permintaan API harian guna menghemat latensi. Buat skrip pengecekan berkala untuk melakukan retraining model dengan data terbaru dari yfinance. Sebelum menyimpan model baru, bandingkan Loss/RMSE dengan model lama dan simpan hanya jika lebih baik atau setara."
