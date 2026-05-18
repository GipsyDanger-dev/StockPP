# Stock Price Forecasting with LSTM Deep Learning

A full-stack web application for predicting stock prices using LSTM (Long Short-Term Memory) neural networks. This project combines a powerful FastAPI backend with an interactive React frontend to provide real-time stock price forecasting with **on-demand auto-training**.

## 🎯 Project Overview

**Stock Price Forecasting System** — A full-stack application using LSTM Deep Learning to predict stock prices. Key innovation: **user selects any stock → system auto-trains 70 epochs → delivers predictions**.

### Key Features
- 📊 **LSTM Deep Learning Model** — 3-layer LSTM with 50 units each + Dropout(0.2)
- 🚀 **Auto-Training On-Demand** — Train any ticker with 70 epochs automatically
- 📈 **Interactive Dashboard** — Real-time visualization of historical and forecasted prices
- 📉 **Performance Metrics** — RMSE and MAE indicators for model accuracy
- 💾 **Model Persistence** — Local .keras + .pkl scaler + optional Supabase cloud backup
- 🔄 **Auto-Retraining** — Scheduled retraining via background scheduler (daily/weekly)
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🧪 **Graceful Degradation** — Auto-fallback to mock data if model unavailable

---

## 🏗️ Project Structure

```
stock-forecast-project/
├── backend/
│   ├── main.py                    # FastAPI entry point, CORS, router prefix
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables (SUPABASE_URL, SUPABASE_KEY)
│   ├── core/
│   │   ├── __init__.py            # Module exports
│   │   ├── data_engine.py         # yfinance data fetching & MinMaxScaler preprocessing
│   │   ├── model.py               # LSTM model architecture (3 layers × 50 units)
│   │   ├── forecasting_service.py # Prediction orchestration + caching + auto-training
│   │   ├── model_manager.py       # Model persistence, versioning, scaler save/load
│   │   ├── model_scheduler.py     # Periodic retraining scheduling (background thread)
│   │   ├── retraining_orchestrator.py # Full retraining workflow with validation
│   │   └── supabase_client.py     # Supabase client (DB + Storage)
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py              # 15+ API endpoints
│   ├── test/
│   │   └── test_ai.py             # AI prediction test script
│   ├── saved_models/              # Model storage
│   │   ├── model_metadata.json    # Versioned model metadata
│   │   └── scalers/               # Scaler .pkl files per ticker
│   ├── train_aapl.py              # Standalone training script
│   ├── run_first_train.py         # First-time training bootstrap
│   ├── test_prediction.py         # Prediction test script
│   └── check_db.py                # Supabase connection checker
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # Router setup (5 routes)
│       ├── index.css              # Global styles & Tailwind imports
│       ├── pages/
│       │   ├── Dashboard.jsx      # Main prediction dashboard
│       │   ├── Analytics.jsx      # Per-ticker deep analytics
│       │   ├── Reports.jsx        # Training history & logs
│       │   ├── Insights.jsx       # Market insights (static placeholder)
│       │   └── Market.jsx         # Multi-ticker market overview
│       ├── components/
│       │   ├── Header.jsx         # Navigation & search bar
│       │   ├── Footer.jsx         # Footer with disclaimers
│       │   ├── PriceChart.jsx     # Recharts visualization
│       │   └── Common.jsx         # Shared UI components
│       ├── hooks/
│       │   └── useApi.js          # 8 TanStack Query hooks
│       ├── services/
│       │   └── apiService.js      # Axios HTTP client
│       └── utils/
│           └── formatting.js      # Number/date formatters
├── documentation/
│   ├── ARCHITECTURE.md            # System architecture guide
│   ├── DEVELOPMENT.md             # Development setup guide
│   ├── AUDIT.md                   # Codebase audit & improvements
│   └── db.md                      # Database schema
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd stock-forecast-project/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment (copy example)
copy ..\.env.example .env
# Edit .env with your SUPABASE_URL and SUPABASE_KEY

# Run FastAPI server
python main.py
```

API will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Frontend Setup

```bash
# Navigate to frontend directory
cd stock-forecast-project/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## 🧠 How It Works

### Auto-Training Flow (Pendekatan A)

```
User searches "TSLA" in Dashboard
     ↓
Frontend → POST /api/v1/forecast {"ticker":"TSLA"}
     ↓
ForecastingService.predict("TSLA")
     ↓
Cek: Apakah model TSLA sudah ada di saved_models/?
     ↓
❌ Tidak ada → Auto-training 70 epoch dimulai!
     ↓
    RetrainingOrchestrator.retrain_model("TSLA", epochs=70)
        ├── Fetch 5 years data from yfinance
        ├── Normalize with MinMaxScaler
        ├── Create 60-day sequences
        ├── Build LSTM (3 layers × 50 units)
        ├── Train 70 epochs
        ├── Evaluate (RMSE, MAE)
        └── Save model + scaler
     ↓
✅ Model siap → Load model + scaler
     ↓
Lanjut prediksi → Kirim hasil ke frontend
```

**Waktu training:** ~5-15 menit per saham (tergantung hardware)

---

## 📡 API Endpoints

### Core Prediction

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/forecast` | Get stock price forecast (auto-trains if no model) |
| GET | `/api/v1/forecast/{ticker}` | Simplified forecast by ticker |
| GET | `/api/v1/historical/{ticker}` | Historical price data |
| GET | `/api/v1/metrics/{ticker}` | Model performance metrics (RMSE, MAE) |
| GET | `/api/v1/validate/{ticker}` | Validate if ticker exists |

### Model Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/retrain/{ticker}` | Manually trigger retraining |
| GET | `/api/v1/retrain/status/{ticker}` | Check model status & age |
| GET | `/api/v1/models/status` | All models overview |
| POST | `/api/v1/batch-retrain` | Retrain multiple tickers at once |

### Supabase Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/market/summary` | All active tickers with prices |
| GET | `/api/v1/reports/history` | Training history from database |
| GET | `/api/v1/health/database` | Database connection health |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health status |
| GET | `/` | Root API info |

### Example: Auto-Train & Forecast
```bash
curl -X POST http://localhost:8000/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{"ticker":"TSLA","days_ahead":5,"period":"1y"}'
# ⚠️ First call will auto-train 70 epochs (~5-15 minutes)
# Subsequent calls return cached/persisted predictions instantly
```

### Example: Batch Train Multiple Stocks
```bash
curl -X POST "http://localhost:8000/api/v1/batch-retrain?force=true" \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["TSLA", "GOOGL", "MSFT"]}'
```

---

## 🔧 Tech Stack

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.104.1 | Web framework |
| tensorflow | 2.14.0 | LSTM deep learning |
| scikit-learn | 1.3.2 | MinMaxScaler preprocessing |
| pandas | 2.1.1 | Data manipulation |
| yfinance | 0.2.32 | Stock data source |
| supabase | 2.0.3 | Cloud persistence |
| schedule | 1.2.0 | Periodic retraining |
| uvicorn | 0.24.0 | ASGI server |

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| react | 18.2.0 | UI framework |
| react-router-dom | 6.x | Client-side routing |
| @tanstack/react-query | 5.x | Data fetching & caching |
| recharts | 2.10.0 | Interactive charts |
| tailwindcss | 3.3.0 | Utility-first CSS |
| lucide-react | latest | Icons |
| axios | latest | HTTP client |
| vite | 5.0.0 | Build tool |

---

## 📊 Model Architecture

```
Input Layer: (60 days, 1 feature)
    ↓
LSTM Layer 1: 50 units → Dropout(0.2)
    ↓
LSTM Layer 2: 50 units → Dropout(0.2)
    ↓
LSTM Layer 3: 50 units → Dropout(0.2)
    ↓
Dense Layer: 1 unit (prediction)
    ↓
Output: Next day closing price
```

### Training Configuration
- **Optimizer**: Adam
- **Loss**: Mean Squared Error
- **Epochs**: 70 (auto-training) / configurable
- **Batch Size**: 32
- **Window Size**: 60 days
- **Train/Test Split**: 80/20
- **Scaler**: MinMaxScaler (0-1)

---

## 💾 Persistence Strategy

| Layer | Type | TTL | Purpose |
|-------|------|-----|---------|
| In-memory cache | Python dict | 1 hour | Quick repeated predictions |
| Browser cache | TanStack Query | 5-10 min | Frontend performance |
| Local filesystem | .keras + .pkl | Permanent | Model + scaler storage |
| Supabase Storage | Cloud | Permanent | Model backup |
| Supabase DB | PostgreSQL | Permanent | Training log audit trail |

---

## 🔬 Testing & Quality

### Backend Testing
```bash
cd backend
# Test prediction
python test_prediction.py

# Check database connection
python check_db.py

# Test single stock training
python train_aapl.py

# First-time training
python run_first_train.py
```

### All 13 API endpoints verified working (✅ 200 OK):
- `/health`, `/`, `/validate/{ticker}`, `/forecast`, `/historical/{ticker}`, `/metrics/{ticker}`, `/retrain/status/{ticker}`, `/models/status`, `/health/database`, `/reports/history`, `/market/summary`

---

## ⚠️ Important Disclaimer

**⚠️ DISCLAIMER:** This tool is for technical analysis purposes only and does not constitute financial advice.

- Stock prices are inherently unpredictable
- LSTM predictions may contain significant errors
- Past performance does not guarantee future results
- Always consult with a financial advisor before making investment decisions
- Use at your own risk

---

## 📚 Documentation

- [ARCHITECTURE.md](documentation/ARCHITECTURE.md) — Complete system architecture
- [DEVELOPMENT.md](documentation/DEVELOPMENT.md) — Development setup guide
- [AUDIT.md](documentation/AUDIT.md) — Codebase audit & improvement plan
- [db.md](documentation/db.md) — Database schema & Supabase setup

---

## 📄 License

This project is provided as-is for educational purposes.

---

**Last Updated:** May 2026
**Version:** 1.1.0