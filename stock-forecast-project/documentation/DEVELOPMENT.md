# Stock Forecast Project - Development Guide

## 📋 Getting Started with Development

### Prerequisites Checklist
- [ ] Python 3.9 or higher installed
- [ ] Node.js 16+ and npm installed
- [ ] Git installed
- [ ] A code editor (VS Code recommended)
- [ ] At least 2GB free disk space
- [ ] Supabase account (free tier) for cloud persistence (optional)

### Project Location
```
c:\Users\lenovo\Desktop\StockPP\stock-forecast-project\
```

---

## 🚀 First Time Setup

### Step 1: Environment Variables
Copy `.env.example` to `.env` in the backend folder:
```bash
cd stock-forecast-project\backend
copy ..\.env.example .env
```
Edit `.env` with your Supabase credentials (if using cloud persistence):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
The system will work **without Supabase** — it falls back to local file storage only.

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd stock-forecast-project\backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import tensorflow; import fastapi; from supabase import create_client; print('✅ Dependencies installed successfully')"
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ..\frontend

# Install Node dependencies
npm install

# Verify installation
npm list react react-dom vite react-router-dom @tanstack/react-query

# Check if everything is good
npm run build
```

### Step 4: Train First Model (Optional but Recommended)

```bash
# Make sure backend venv is active
cd ..\backend
venv\Scripts\activate

# First-time training (AAPL, 70 epochs)
python run_first_train.py

# Or manually for any ticker
python -c "
from core.retraining_orchestrator import RetrainingOrchestrator
orch = RetrainingOrchestrator()
res = orch.retrain_model('AAPL', period='5y', epochs=70, force_retrain=True)
print(f'Status: {res[\"status\"]}, RMSE: {res[\"new_metrics\"][\"rmse\"]}')
"
```

---

## ▶️ Running the Application

### Terminal 1: Start Backend API

```bash
cd stock-forecast-project\backend

# Activate venv (if not already activated)
venv\Scripts\activate

# Start FastAPI server
python main.py

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete
```

**API Available at:**
- Main: http://localhost:8000
- Docs: http://localhost:8000/docs (Swagger UI)
- ReDoc: http://localhost:8000/redoc

### Terminal 2: Start Frontend Dev Server

```bash
cd stock-forecast-project\frontend

# Start Vite development server
npm run dev

# Expected output:
#   VITE v5.0.0  ready in XXX ms
#   Local:   http://localhost:5173/
```

**App Available at:**
- http://localhost:5173

---

## 🧪 Testing API Endpoints

### Health Check
```bash
# Via browser: http://localhost:8000/health
curl http://localhost:8000/health
# → {"status":"API is running","version":"1.0.0"}
```

### Auto-Train & Forecast (New Stock)
```bash
# This will auto-train TSLA with 70 epochs if no model exists
curl -X POST http://localhost:8000/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{"ticker":"TSLA","days_ahead":5,"period":"1y"}'
# ⏱️ First call: ~5-15 min (training 70 epochs)
# ⚡ Subsequent calls: instant (cached/persisted)
```

### Forecast Existing Stock
```bash
curl -X POST http://localhost:8000/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","days_ahead":5,"period":"1y"}'
# → Returns forecast with RMSE, MAE, trend, model_source
```

### Validate Ticker
```bash
curl http://localhost:8000/api/v1/validate/AAPL
# → {"ticker":"AAPL","is_valid":true,"message":"Ticker is valid",...}
```

### Get Model Metrics
```bash
curl http://localhost:8000/api/v1/metrics/AAPL
# → {"ticker":"AAPL","metrics":{"rmse":0.059,"mae":0.047,...}}
```

### Check Training Status
```bash
curl http://localhost:8000/api/v1/retrain/status/AAPL
# → {"model_exists":true,"age_hours":5.2,"should_retrain":false,...}
```

### All Models Status
```bash
curl http://localhost:8000/api/v1/models/status
# → {"total_models":1,"models_needing_retrain":0,...}
```

### Market Summary (requires Supabase data)
```bash
curl http://localhost:8000/api/v1/market/summary
# → {"tickers":[...],"total":N,...}
```

### Training Reports (requires Supabase data)
```bash
curl http://localhost:8000/api/v1/reports/history?limit=10
# → {"reports":[...],"total":N,...}
```

### Database Health Check
```bash
curl http://localhost:8000/api/v1/health/database
# → {"database":"connected","status":"healthy",...}
```

---

## 📝 Common Development Tasks

### Train a New Stock

```python
# Method 1: Python script
from core.retraining_orchestrator import RetrainingOrchestrator
orch = RetrainingOrchestrator()
result = orch.retrain_model("GOOGL", period="5y", epochs=70, force_retrain=True)
print(f"RMSE: {result['new_metrics']['rmse']}")
```

```bash
# Method 2: API
curl -X POST http://localhost:8000/api/v1/retrain/GOOGL
```

### Train Multiple Stocks (Batch)

```python
# Python
from core.retraining_orchestrator import RetrainingOrchestrator
orch = RetrainingOrchestrator()
result = orch.batch_retrain(
    tickers=["TSLA", "GOOGL", "MSFT", "AMZN"],
    epochs=70,
    force_retrain=True
)
print(result["summary"])
```

```bash
# API
curl -X POST "http://localhost:8000/api/v1/batch-retrain?force=true" \
  -H "Content-Type: application/json" \
  -d '{"tickers":["TSLA","GOOGL","MSFT","AMZN"]}'
```

### Test Prediction
```bash
cd backend
python test_prediction.py
```

### Check Database Connection
```bash
cd backend
python check_db.py
```

### Build Frontend for Production
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

---

## 📁 Project Structure Breakdown

```
backend/
├── main.py                     # FastAPI app entry point
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (git-ignored)
├── core/
│   ├── data_engine.py          # yfinance data fetching & preprocessing
│   ├── model.py                # LSTM neural network (3 layers, 50 units)
│   ├── forecasting_service.py  # Prediction orchestration + auto-training
│   ├── model_manager.py        # Model persistence, versioning, scaler save/load
│   ├── model_scheduler.py      # Periodic retraining (background thread)
│   ├── retraining_orchestrator.py # Full retraining workflow with validation
│   └── supabase_client.py      # Supabase cloud client
├── api/
│   └── routes.py               # 15+ API endpoints
├── saved_models/               # Trained models + scalers + metadata
└── test/
    └── test_ai.py              # AI test script

frontend/
├── package.json                # Node dependencies
├── index.html                  # HTML entry point
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Router (5 routes)
    ├── pages/
    │   ├── Dashboard.jsx       # Main prediction dashboard
    │   ├── Analytics.jsx       # Per-ticker deep analytics
    │   ├── Reports.jsx         # Training history
    │   ├── Insights.jsx        # Market insights (placeholder)
    │   └── Market.jsx          # Multi-ticker overview
    ├── components/             # Reusable UI components
    ├── hooks/useApi.js         # TanStack Query hooks (8 hooks)
    ├── services/apiService.js  # Axios HTTP client
    └── utils/formatting.js     # Number/date formatters
```

---

## 🎯 Key Files to Understand

1. **`backend/core/forecasting_service.py`** — Auto-training logic, caching, mock fallback
2. **`backend/core/model_manager.py`** — Model persistence, scaler save/load, versioning
3. **`backend/core/retraining_orchestrator.py`** — Full retraining pipeline with validation
4. **`backend/api/routes.py`** — All 15+ API endpoints
5. **`frontend/src/pages/Dashboard.jsx`** — Main UI (search, chart, metrics)
6. **`frontend/src/hooks/useApi.js`** — 8 data-fetching hooks with caching
7. **`frontend/src/services/apiService.js`** — API communication layer

---

## 🧪 Testing Features

### Python Test Script

```python
# Save as: test_api.py in backend directory
import requests

BASE = "http://localhost:8000"

# Health check
r = requests.get(f"{BASE}/health")
print(f"Health: {r.json()}")

# Forecast (will auto-train if no model)
r = requests.post(f"{BASE}/api/v1/forecast", json={
    "ticker": "AAPL",
    "days_ahead": 5,
    "period": "1y"
})
data = r.json()
print(f"Ticker: {data['ticker']}")
print(f"Price: ${data['current_price']}")
print(f"Trend: {data['trend']}")
print(f"RMSE: {data['metrics']['rmse']}")
print(f"Model: {data['model_source']}")
```

### Verify All Models
```bash
curl http://localhost:8000/api/v1/models/status
# Shows all trained models, their age, and retraining needs
```

---

## 🔒 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=True

# Frontend
VITE_API_URL=http://localhost:8000/api/v1

# Model
MODEL_PATH=backend/saved_models/lstm_model.keras
WINDOW_SIZE=60

# Data
DATA_PERIOD=5y
TRAIN_TEST_SPLIT=0.8

# API
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Supabase (Optional - for cloud persistence)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Logging
LOG_LEVEL=INFO
```

**⚠️ Important**: The system works fully without Supabase. Models are always saved locally in `saved_models/`.

---

## 🚨 Troubleshooting

### Backend Issues

| Problem | Solution |
|---------|----------|
| Port 8000 in use | `netstat -ano \| findstr :8000` then `taskkill /PID <PID> /F` |
| TensorFlow not found | `pip install tensorflow` |
| yfinance error | `pip install --upgrade yfinance` |
| Supabase connection failed | Check `.env` credentials or ignore (runs locally) |
| Training too slow | Reduce epochs (e.g., 10) for quick testing |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| Port 5173 in use | `npm run dev -- --port 3000` |
| Module not found | `npm install` |
| API not responding | Ensure backend is running on port 8000 |

### Model Issues

| Problem | Solution |
|---------|----------|
| Poor predictions | Train with more data (5y period) or increase epochs to 100 |
| Out of memory | Reduce batch size to 16 |
| Auto-training timeout | First call takes 5-15 min — be patient |

---

## ✅ Development Checklist

- [ ] Backend setup complete (venv + pip install)
- [ ] Frontend setup complete (npm install)
- [ ] `.env` configured (Supabase optional)
- [ ] Both servers running
- [ ] Health check passes: `GET /health`
- [ ] Can search for tickers on Dashboard
- [ ] Auto-training works for new tickers
- [ ] Dashboard displays dynamic data (not static)
- [ ] Analytics page shows real metrics
- [ ] Supabase database connected (optional check)
- [ ] Reports page loads (empty if no training done)
- [ ] Market page shows data (needs Supabase tickers)
- [ ] No console errors in browser
- [ ] Charts render correctly

---

## 📚 Documentation Links

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Complete system architecture
- [AUDIT.md](./AUDIT.md) — Full codebase audit (bugs, improvements, action items)
- [db.md](./db.md) — Database schema & Supabase setup
- [README.md](../README.md) — Project overview & quick start

---

## 🎓 Learning Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **TensorFlow LSTM**: https://www.tensorflow.org/tutorials/structured_data/time_series
- **React**: https://react.dev/learn
- **Vite**: https://vitejs.dev/guide/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TanStack Query**: https://tanstack.com/query/latest
- **Supabase**: https://supabase.com/docs

---

**Happy Coding! 🎉**