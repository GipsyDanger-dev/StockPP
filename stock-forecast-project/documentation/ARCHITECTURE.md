# Stock Forecast Project - Architecture & Implementation Guide

## 🎯 Project Overview

**Stock Price Forecasting System** - A full-stack application using LSTM Deep Learning to predict stock prices. Built with modern technology stack for scalability, performance, and user experience.

### System Goals
- Predict closing stock prices using 60-day historical LSTM sequences
- Provide interactive real-time dashboard with visualizations
- Display model performance metrics (RMSE, MAE)
- Support multiple stock tickers from worldwide markets
- Enable data export for further analysis
- Persist models with versioning and cloud backup (Supabase)
- Automate periodic retraining via configurable scheduling

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Routes (React Router)                                       │  │
│  │  ├─ / → Dashboard (Main prediction view)                    │  │
│  │  ├─ /analytics/:ticker → Precision Analytics                │  │
│  │  ├─ /reports → Training Reports & History                   │  │
│  │  ├─ /insights → Market Insights & Trends                    │  │
│  │  └─ /market → Market Overview                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          ↓ HTTP/JSON ↓                                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    API LAYER (FastAPI)                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Endpoints:                          Handler (routes.py)     │  │
│  │  • POST /api/v1/forecast           → ForecastingService      │  │
│  │  • GET  /api/v1/historical         → DataEngine              │  │
│  │  • GET  /api/v1/metrics            → ModelManager            │  │
│  │  • GET  /api/v1/validate/{ticker}  → ForecastingService      │  │
│  │  • GET  /api/v1/health             → Direct                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          ↓                                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│               BACKEND LOGIC (Python/TensorFlow)                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER                                                 │  │
│  │  ┌─ forecasting_service.py ──────────────────────────────┐   │  │
│  │  │  Orchestrates end-to-end prediction:                  │   │  │
│  │  │  1. Check in-memory cache (1-hour TTL)                │   │  │
│  │  │  2. Load model & scaler via ModelManager              │   │  │
│  │  │  3. Fetch real data from yfinance                     │   │  │
│  │  │  4. Preprocess with saved scaler                      │   │  │
│  │  │  5. Run sliding-window LSTM predictions               │   │  │
│  │  │  6. Inverse-transform to price range                  │   │  │
│  │  │  7. Return JSON response                              │   │  │
│  │  │  → Falls back to _generate_mock_forecast() if model   │   │  │
│  │  │    or data unavailable (for demo/dev)                 │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  │  ┌─ retraining_orchestrator.py ────────────────────────┐   │  │
│  │  │  Full retraining workflow:                          │   │  │
│  │  │  1. Check if retraining is needed (age check)       │   │  │
│  │  │  2. Fetch fresh data, prepare sequences             │   │  │
│  │  │  3. Build & train new LSTM model                   │   │  │
│  │  │  4. Evaluate & compare with old model metrics       │   │  │
│  │  │  5. Validate improvement (±2% RMSE tolerance)      │   │  │
│  │  │  6. Save if better or keep old model                │   │  │
│  │  │  → Supports batch retrain for multiple tickers      │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  DATA ENGINE (core/data_engine.py)                            │  │
│  │  ├─ fetch_data()       → yfinance integration                │  │
│  │  ├─ prepare_data()     → MinMaxScaler normalization (0-1)   │  │
│  │  ├─ create_sequences() → 60-day sliding windows              │  │
│  │  └─ inverse_transform()→ Scale back to prices               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ML MODEL (core/model.py)                                     │  │
│  │  ├─ LSTM: 3 layers × 50 units + Dropout(0.2)                │  │
│  │  ├─ Optimizer: Adam / Loss: Mean Squared Error              │  │
│  │  ├─ Epochs: 70 (configurable) / Batch: 32                   │  │
│  │  └─ Saved as .keras format with versioned filenames         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PERSISTENCE LAYER                                            │  │
│  │  ├─ model_manager.py: Save/load models, track metadata,      │  │
│  │  │  validate improvements, manage versions (keeps last 5)    │  │
│  │  ├─ model_scheduler.py: Periodic retraining via `schedule`   │  │
│  │  │  (daily, weekly, or hourly interval) in background thread │  │
│  │  └─ supabase_client.py: Cloud storage for model files        │  │
│  │     + training_logs database table for audit trail           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          ↓                                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES & DATA SOURCES                    │
│  • yfinance: Yahoo Finance API for OHLCV stock data                │
│  • Supabase: Cloud PostgreSQL + Storage (model backup, logs)       │
│  • (Optional) CloudWatch/Application Insights for monitoring       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### Complete Request-Response Cycle

```
1. USER INTERACTION
   ├─ Search ticker (e.g., "AAPL")
   ├─ Select period (1y, 5y)
   └─ Select forecast days (1-30)
           ↓
2. FRONTEND (React Router → Page Component)
   ├─ TanStack Query hook fires (useForecast, useHistoricalData, etc.)
   ├─ useApi.js hook manages: caching (5-10 min), retry (2 attempts),
   │  loading/error states, stale-while-revalidate
   └─ GET or POST to FastAPI via Axios (apiService.js)
           ↓
3. API LAYER (FastAPI — routes.py)
   ├─ Validate request with Pydantic
   ├─ Route to ForecastingService.predict()
   └─ Return JSON response
           ↓
4. FORECASTING SERVICE (forecasting_service.py)
   ├─ CHECK 1: In-memory cache hit? (< 1 hour old)
   │   └─ If YES → return cached response immediately
   ├─ CHECK 2: Persisted model exists for ticker?
   │   ├─ Load model + scaler from ModelManager
   │   └─ If NO → return _generate_mock_forecast() (demo/dev mode)
   ├─ Fetch real OHLCV data from yfinance via DataEngine
   ├─ Validate data quantity (minimum 70 data points)
   ├─ Scale using PRE-TRAINED scaler (transform, NOT fit_transform)
   ├─ Generate predictions via sliding-window LSTM
   ├─ Inverse-transform predictions to price range
   ├─ Calculate trend & change_percent
   └─ Store in cache + return JSON response
           ↓
5. FRONTEND RENDERING
   ├─ Dashboard.jsx: Full dashboard (KPI cards, chart, table)
   ├─ Analytics.jsx: Deep-dive precision analytics view
   │  (confidence score, technical indicators, export)
   ├─ Reports.jsx: Training history and model performance logs
   ├─ Insights.jsx: Market trends and prediction insights
   └─ Market.jsx: Multi-ticker market overview
           ↓
6. USER SEES
   ├─ Real-time price + forecast chart (Recharts)
   ├─ Performance metrics (RMSE, MAE)
   ├─ Bullish/Bearish trend with change percentage
   ├─ Model source indicator (persisted vs. mock)
   └─ Export options for dataset
```

### Retraining & Model Lifecycle Flow

```
EXTERNAL TRIGGERS:
   ├─ ModelScheduler (scheduled task)
   ├─ Manual API call
   └─ Startup initialization
           ↓
RETRAINING ORCHESTRATOR (retraining_orchestrator.py)
   1. should_retrain() → check model age (default: 24h stale)
   2. Fetch fresh data from yfinance
   3. Prepare sequences (60-day windows)
   4. Split: 80% train / 20% test
   5. Build new LSTM model
   6. Train for N epochs (default: 10 for retrain)
   7. Evaluate on test set (RMSE, MAE)
   8. Compare with old model metrics
   9. validate_model_improvement() → ±2% RMSE tolerance
  10. If BETTER → save_model() + update metadata + upload to Supabase
  11. If WORSE  → discard, keep old model
           ↓
MODEL MANAGER (model_manager.py)
   ├─ Saves .keras file to saved_models/{TICKER}_current.keras
   ├─ Records metadata: timestamp, metrics, version history (last 5)
   ├─ Inserts training_log into Supabase (audit trail)
   └─ Uploads model file to Supabase Storage bucket "models"
```

---

## 🔧 Technical Components

### Backend Stack

#### 1. FastAPI (`main.py`)
- **Purpose**: Web framework & API endpoint management
- **Key Features**:
  - Async/await for performance
  - Automatic OpenAPI documentation (/docs)
  - CORS middleware for frontend communication
  - Request validation with Pydantic
- **Routes**: All endpoints prefixed with `/api/v1`
- **Server**: uvicorn on `127.0.0.1:8000`

#### 2. Data Engine (`core/data_engine.py`)
- **Purpose**: Data fetching and preprocessing
- **Key Methods**:
  - `fetch_data()` - yfinance integration
  - `prepare_data()` - MinMaxScaler normalization
  - `create_sequences()` - 60-day windowing
  - `inverse_transform()` - Scale back to prices
- **Output**: Normalized sequences for LSTM

#### 3. LSTM Model (`core/model.py`)
- **Purpose**: Deep learning time series forecasting
- **Architecture**:
  ```
  Input Layer: (60, 1)
    ↓
  LSTM Layer 1: 50 units → Dropout(0.2)
    ↓
  LSTM Layer 2: 50 units → Dropout(0.2)
    ↓
  LSTM Layer 3: 50 units → Dropout(0.2)
    ↓
  Dense Layer: 1 unit (prediction)
    ↓
  Output: Single price prediction
  ```
- **Training**:
  - Optimizer: Adam
  - Loss: Mean Squared Error
  - Epochs: 70 (configurable)
  - Batch Size: 32

#### 4. Forecasting Service (`core/forecasting_service.py`)
- **Purpose**: Orchestrates end-to-end prediction pipeline
- **Key Responsibilities**:
  - In-memory caching (1-hour TTL per unique request)
  - Graceful degradation: falls back to `_generate_mock_forecast()` if no model/data
  - Sliding-window multi-step prediction (iterative)
  - Trend analysis (Bullish/Bearish) with `change_percent`
  - Serves as the bridge between API layer and ML components
- **Key Methods**:
  - `predict(ticker, days_ahead, period)` → Full forecast response
  - `validate_ticker(ticker)` → Ticker existence check
  - `_generate_mock_forecast()` → Demo data when model unavailable

#### 5. Model Manager (`core/model_manager.py`)
- **Purpose**: Model persistence, versioning, and lifecycle management
- **Key Features**:
  - `save_model()` → Save .keras file + metadata + optional cloud upload
  - `load_model()` → Load model by ticker
  - `load_model_and_scaler()` → Load model + scaler in sync (critical for correct predictions)
  - `should_retrain()` → Age-based expiry check (default 24h)
  - `validate_model_improvement()` → Compare old vs new metrics (±2% tolerance)
  - `get_model_metrics()` / `get_model_age()` → Model health queries
- **Metadata**: JSON file (`saved_models/model_metadata.json`) tracking all model versions
- **Versioning**: Keeps last 5 model versions per ticker
- **Cloud Sync**: Optional Supabase Storage upload for model backup

#### 6. Model Scheduler (`core/model_scheduler.py`)
- **Purpose**: Periodic model retraining and maintenance
- **Schedule Types**:
  - `schedule_daily_retrain()` → Daily at a specific time
  - `schedule_weekly_retrain()` → Weekly on a specific day/time
  - `schedule_periodic_retrain()` → Hourly interval (e.g., every 12h)
- **Architecture**: Background daemon thread using `schedule` library
- **Task Tracking**: `ScheduleTask` dataclass with status, timestamps, and job info

#### 7. Retraining Orchestrator (`core/retraining_orchestrator.py`)
- **Purpose**: Orchestrates the complete model retraining workflow
- **Key Methods**:
  - `retrain_model()` → End-to-end: fetch → prepare → build → train → evaluate → save
  - `batch_retrain()` → Multi-ticker retraining with summary statistics
  - `get_retraining_status()` → Overview of all models and retraining needs
- **Default Tickers**: `["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]`

#### 8. Supabase Client (`core/supabase_client.py`)
- **Purpose**: Cloud storage for model files + database for training logs
- **Persistence**: Models and training history survive server restarts
- **Key Functions**:
  - `SupabaseClient` singleton (lazy initialization)
  - `insert_training_log()` → Records training sessions in PostgreSQL
  - `get_training_logs()` → Query training history
  - `get_all_tickers()` → Fetch active tickers from database
  - `upload_model_file()` → Store model .keras files in cloud bucket
  - `download_model_file()` → Retrieve models from cloud
- **Credentials**: Via `.env` → `SUPABASE_URL` and `SUPABASE_KEY`

### Frontend Stack

#### 1. React (`src/App.jsx`)
- **Purpose**: User interface & client-side routing
- **Routing** (React Router v6):
  | Path | Page | Description |
  |------|------|-------------|
  | `/` | Dashboard | Main prediction view with KPI cards, chart, table |
  | `/analytics/:ticker` | Analytics | Deep-dive precision analytics per stock |
  | `/reports` | Reports | Training history and model performance logs |
  | `/insights` | Insights | Market trends and AI-driven insights |
  | `/market` | Market | Multi-ticker market overview |
- **State Management**: React hooks & TanStack Query (React Query)
- **Key Features**:
  - Component-based architecture
  - Real-time data updates via query invalidation
  - Error handling & loading states
  - Stale-while-revalidate caching strategy

#### 2. Custom Hooks (`src/hooks/useApi.js`)
- **Purpose**: API data fetching with caching and retry logic
- **Available Hooks**:
  - `useForecast(ticker, days, period)` → Stock predictions
  - `useHistoricalData(ticker, period)` → Historical prices
  - `useMetrics(ticker)` → Model metrics
  - `useValidateTicker(ticker)` → Ticker validation
  - `useHealth()` → API status check
- **Benefits**:
  - Automatic caching (5-10 min stale time)
  - Retry logic (2 failed attempts)
  - Loading/error states built-in
  - Cache invalidation on mutation

#### 3. API Service (`src/services/apiService.js`)
- **Purpose**: HTTP communication layer
- **Features**:
  - Axios instance with interceptors
  - Request/response logging
  - Centralized error handling
  - Base URL configuration via environment variable

#### 4. Pages (`src/pages/`)
- **Dashboard.jsx**: Main landing page — search, KPI metrics, price chart, data table
- **Analytics.jsx**: Per-ticker deep dive — confidence score, MA(50)/MA(200), RSI, MACD
- **Reports.jsx**: Training logs and model performance history
- **Insights.jsx**: Market trends and AI-predicted insights
- **Market.jsx**: Multi-stock market overview

#### 5. Components (`src/components/`)
- **Header.jsx**: Navigation & search
- **Sidebar.jsx**: Control panel
- **PriceChart.jsx**: Recharts line chart for actual vs forecast
- **Footer.jsx**: Disclaimer & info
- **Common.jsx**: Reusable UI components (cards, badges, spinners)

#### 6. Utilities (`src/utils/`)
- **formatting.js**: `formatCurrency()`, `formatPercent()`, date formatters

#### 7. Styling
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS transformation pipeline
- **Lucide React**: Icons library
- **Theme**: Professional slate/indigo color palette

---

## 🔄 Key Processes

### Model Training Process
```python
# Full training (backend/train_aapl.py / run_first_train.py)
1. Fetch 5 years of historical data via yfinance
2. Extract closing prices
3. Normalize prices (0-1 range) using MinMaxScaler
4. Create sequences (60-day sliding windows)
5. Split data (80% train, 20% test)
6. Initialize LSTM model
7. Train for 50 epochs
8. Evaluate on test data → RMSE & MAE
9. Save model to saved_models/{TICKER}_current.keras
10. Save scaler alongside model for consistent transform
11. Record metadata (timestamp, metrics)
12. Upload to Supabase Storage (if configured)
```

### Prediction Process
```python
# Real-time prediction (forecasting_service.py)
1. Check in-memory cache (cache hit < 1 hour → return)
2. Load pre-trained model + scaler
3. If model unavailable → generate mock forecast for demo
4. Fetch last 60+ days of real prices from yfinance
5. Scale using the EXACT SAME scaler (transform, NOT fit_transform)
6. Create single sequence of last 60 days
7. Iterative prediction:
   for each day ahead:
     a. Predict next price via LSTM
     b. Append prediction to sequence
     c. Drop oldest value (sliding window)
8. Inverse-transform all predictions to USD prices
9. Calculate trend direction + change_percent
10. Format JSON response with:
    - Historical data points (last 20 days)
    - Forecast data points (N days ahead)
    - Performance metrics (RMSE, MAE)
    - Trend + change percentage
    - Model source (persisted / mock)
11. Store in cache, return response
```

### Retraining & Model Improvement Process
```python
# Retraining (retraining_orchestrator.py + model_manager.py)
1. Trigger: scheduler, API call, or startup
2. should_retrain() → True if no model exists or model > 24h old
3. If force_retrain=False and model is recent → SKIP
4. Fetch fresh market data
5. Build new LSTM model from scratch
6. Train on fresh data
7. Evaluate: get new_metrics (RMSE, MAE)
8. Load old model metrics for comparison
9. validate_model_improvement():
   - If no old model → accept
   - If new RMSE ≤ old RMSE + 2% tolerance → accept
   - Otherwise → REJECT (keep old model)
10. If accepted → save_model() + cloud upload + log training record
```

---

## 💾 Persistence & Infrastructure

### Model Storage Strategy

```
saved_models/
├── model_metadata.json        # Master metadata file (JSON)
├── AAPL_current.keras         # Current best model for AAPL
├── GOOGL_current.keras        # Current best model for GOOGL
├── MSFT_current.keras         # Current best model for MSFT
├── ... (one per trained ticker)
└── scalers/                   # Scaler files (optional, embedded in metadata)
```

### Metadata Tracking (`model_metadata.json`)
```json
{
  "AAPL": {
    "current": {
      "timestamp": "2026-05-17T10:30:00",
      "path": "saved_models/AAPL_current.keras",
      "metrics": { "rmse": 2.45, "mae": 1.78 }
    },
    "versions": [
      { "timestamp": "...", "path": "...", "metrics": { ... } },
      { "timestamp": "...", "path": "...", "metrics": { ... } }
    ]
  }
}
```

### Caching Strategy

| Layer | Cache Type | TTL | Purpose |
|-------|-----------|-----|---------|
| In-memory (Python dict) | Request-level | 1 hour | ForecastingService.predict() |
| TanStack Query (Browser) | Client-side | 5-10 min | Hook-level caching |
| Supabase Storage | Cloud | Permanent | Model file backup |
| Supabase DB | Cloud | Permanent | Training log audit trail |

### Supabase Integration

- **Database Tables**: `tickers`, `training_logs` (PostgreSQL via Supabase)
- **Storage Bucket**: `models/` — Organized by ticker symbol
- **Training Log Schema**: `ticker`, `report_name`, `rmse`, `mae`, `status`, `created_at`
- **Fallback**: If Supabase is unavailable, the system operates purely locally

### Environment Configuration (`.env.example`)

```
# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Frontend
VITE_API_URL=http://localhost:8000/api/v1

# Model
WINDOW_SIZE=60

# Supabase (Required for cloud persistence)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 📈 Performance Metrics

### Model Evaluation Metrics
- **RMSE** (Root Mean Square Error)
  - Penalizes large errors more heavily
  - Scale: Same as price (dollars)
  - Lower is better
- **MAE** (Mean Absolute Error)
  - Average absolute error
  - Scale: Same as price (dollars)
  - Lower is better

### Expected Performance
- Typical RMSE: $2-$5 (varies by stock)
- Typical MAE: $1-$3 (varies by stock)
- Directional accuracy: 60-75%

---

## 🔒 Security Considerations

### Current (Development)
- CORS enabled for localhost only
- No authentication required
- Input validation on all endpoints
- Error messages sanitized

### Production (Recommended)
- Enable authentication (JWT/OAuth2)
- Rate limiting per IP
- HTTPS/SSL encryption
- Database for model caching
- Redis for API caching
- Docker containerization
- API key management

---

## 🚀 Deployment Architecture

### Development
```
Local Machine:
├─ Backend: localhost:8000
├─ Frontend: localhost:5173
├─ Database: Supabase (cloud) or None (mock/demo mode)
└─ Models: Local filesystem + optional Supabase Storage
```

### Production (Recommended)
```
Cloud Provider (AWS/Azure/GCP):
├─ Frontend: CloudFront/CDN (static S3/GCS bucket)
├─ Backend: Elastic Container Service / App Service
├─ Database: RDS / CosmosDB (or Supabase for all-in-one)
├─ Cache: ElastiCache / Redis
├─ Model Storage: S3 / Blob Storage
└─ Monitoring: CloudWatch / Application Insights
```

---

## 📝 File Structure Reference

### Backend Structure
```
backend/
├── main.py                      # FastAPI app, CORS, router prefix
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (git-ignored)
├── core/
│   ├── __init__.py              # Module exports
│   ├── data_engine.py           # Data fetching & preprocessing
│   ├── model.py                 # LSTM model definition & training
│   ├── forecasting_service.py   # Prediction orchestration + caching
│   ├── model_manager.py         # Model persistence, versioning, supabase sync
│   ├── model_scheduler.py       # Periodic retraining scheduling
│   ├── retraining_orchestrator.py # Full retraining workflow
│   └── supabase_client.py       # Supabase client (DB + Storage)
├── api/
│   ├── __init__.py              # API exports
│   └── routes.py                # 5 endpoints + validation
├── test/
│   └── test_ai.py               # AI model tests
├── saved_models/                # Model storage directory
│   └── model_metadata.json      # Versioned model metadata
├── train_aapl.py                # Standalone AAPL training script
├── run_first_train.py           # First-time training bootstrap
├── test_prediction.py           # Prediction test script
└── check_db.py                  # Database connectivity checker
```

### Frontend Structure
```
frontend/
├── index.html                  # HTML entry point
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite bundler configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Router setup (5 routes)
    ├── index.css               # Global styles & Tailwind imports
    ├── pages/
    │   ├── Dashboard.jsx       # Main prediction dashboard
    │   ├── Analytics.jsx       # Per-ticker deep analytics
    │   ├── Reports.jsx         # Training history & logs
    │   ├── Insights.jsx        # Market insights & trends
    │   └── Market.jsx          # Multi-ticker market overview
    ├── components/
    │   ├── Header.jsx          # Navigation & search bar
    │   ├── Footer.jsx          # Footer with disclaimers
    │   ├── PriceChart.jsx      # Recharts visualization
    │   └── Common.jsx          # Shared UI components
    ├── hooks/
    │   └── useApi.js           # 5 TanStack Query hooks
    ├── services/
    │   └── apiService.js       # Axios HTTP client
    └── utils/
        └── formatting.js       # Number/date formatters
```

---

## 🎯 Development Workflow

### Adding a New Feature

1. **Backend**:
   - Create new function in `core/` (e.g., new analysis logic)
   - Add business logic to `forecasting_service.py` if needed
   - Create API endpoint in `api/routes.py`
   - Add new hook in `frontend/src/hooks/useApi.js`
   - Test with curl/Postman + browser
   - Document in this ARCHITECTURE.md and README

2. **Frontend**:
   - Create React component in `components/`
   - Create custom hook if data-fetching needed
   - Add route in `App.jsx` if new page
   - Add to Dashboard or create new page in `pages/`
   - Test in browser (localhost:5173)
   - Update UI documentation

3. **Integration**:
   - Test end-to-end (frontend → backend → model)
   - Check browser console for errors
   - Validate data flow in network tab
   - Verify cache invalidation
   - Commit to git with descriptive message

### Testing Checklist
- [ ] Backend API responds (GET /health, POST /forecast)
- [ ] Data loads in 2-5 seconds
- [ ] Charts render correctly (Recharts)
- [ ] Metrics display accurately (RMSE, MAE, change %)
- [ ] No console errors
- [ ] Export functions work
- [ ] All tickers validate
- [ ] Mobile responsive (Tailwind breakpoints)
- [ ] Mock data fallback works when no model present

---

## 📚 API Reference

### POST /api/v1/forecast
**Purpose**: Get stock price forecast

**Request**:
```json
{
  "ticker": "AAPL",
  "days_ahead": 5,
  "period": "1y"
}
```

**Response**:
```json
{
  "ticker": "AAPL",
  "current_price": 180.50,
  "historical": [
    {"date": "2024-01-01", "price": 180.50}
  ],
  "forecast": [
    {"date": "2024-01-15", "price": 185.20}
  ],
  "metrics": {
    "rmse": 2.45,
    "mae": 1.78
  },
  "trend": "Bullish",
  "change_percent": 2.61,
  "timestamp": "2024-01-14T10:30:00",
  "model_source": "persisted"
}
```

### GET /api/v1/validate/{ticker}
**Purpose**: Validate ticker existence

**Response**:
```json
{
  "ticker": "AAPL",
  "valid": true,
  "message": "Ticker is valid",
  "timestamp": "2024-01-14T10:30:00"
}
```

### GET /api/v1/health
**Purpose**: API health status

**Response**:
```json
{
  "status": "API is running",
  "version": "1.0.0"
}
```

---

## 🧪 Mock Data / Demo Mode

When no trained model exists for a ticker, the system gracefully falls back to mock predictions:

- `model_source` field in response indicates `"mock"` vs `"persisted"`
- Mock data generates pseudo-random prices based on `hash(ticker)` for consistency
- Simple trend with noise simulates realistic-looking forecast movements
- Mock RMSE: 2.5 / Mock MAE: 1.8 (reasonable defaults)
- This allows the frontend to be developed and demoed without a trained model

---

## 🎓 Next Steps

1. **Run the application**: Follow DEVELOPMENT.md for setup
2. **Train the model**: Run `python train_aapl.py` or `python run_first_train.py`
3. **Monitor retraining**: Check training logs in Supabase or `/reports` page
4. **Add features**: Extend API with new endpoints, add new pages
5. **Deploy**: Choose cloud provider, configure Supabase for persistence
6. **Scale**: Add Redis caching, Docker containerization, CI/CD pipeline

---

## 📁 Related Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) — Setup, installation, and local development
- [db.md](./db.md) — Database schema and Supabase configuration details
- [README.md](../README.md) — Project overview and quick start
- **FRONTEND_INTEGRATION_COMPLETE.md** — Frontend integration checklist

---

**Last Updated**: May 2026
**Version**: 1.1.0
**Status**: ✅ Complete & Operational