# Stock Forecast Project - Development Guide

## 📋 Getting Started with Development

### Prerequisites Checklist
- [ ] Python 3.9 or higher installed
- [ ] Node.js 16+ and npm installed
- [ ] Git installed
- [ ] A code editor (VS Code recommended)
- [ ] At least 2GB free disk space

### Project Location
```
c:\Users\lenovo\Desktop\StockPP\stock-forecast-project\
```

## 🚀 First Time Setup

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd stock-forecast-project\backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import tensorflow; import fastapi; print('✅ Dependencies installed successfully')"
```

### Step 2: Frontend Setup

```bash
# Navigate to frontend directory
cd ..\frontend

# Install Node dependencies
npm install

# Verify installation
npm list react react-dom vite

# Check if everything is good
npm run build
```

## ▶️ Running the Application

### Terminal 1: Start Backend API

```bash
cd backend

# Activate venv (if not already activated)
venv\Scripts\activate

# Start FastAPI server
python main.py

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

**API Available at:**
- Main: http://localhost:8000
- Docs: http://localhost:8000/docs (Swagger UI)
- ReDoc: http://localhost:8000/redoc

### Terminal 2: Start Frontend Dev Server

```bash
cd frontend

# Start Vite development server
npm run dev

# Expected output:
#   VITE v5.0.0  ready in XXX ms
#   Local:   http://localhost:5173/
```

**App Available at:**
- http://localhost:5173

## 📝 Common Development Tasks

### Test Backend API

```bash
# Check health
curl http://localhost:8000/health

# Get forecast
curl -X POST http://localhost:8000/api/v1/forecast \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","days_ahead":5,"period":"1y"}'

# Validate ticker
curl http://localhost:8000/api/v1/validate/AAPL
```

### Build for Production

```bash
# Frontend
cd frontend
npm run build
# Output goes to: frontend/dist

# Backend is already production-ready
```

### Stop Servers

```bash
# Backend: Press Ctrl+C in backend terminal
# Frontend: Press Ctrl+C in frontend terminal
```

## 🔧 Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'tensorflow'"
**Solution:**
```bash
cd backend
pip install tensorflow
```

### Issue: "Port 8000 already in use"
**Solution:**
```bash
# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue: "Port 5173 already in use"
**Solution:**
```bash
cd frontend
npm run dev -- --port 3000
```

### Issue: "npm: command not found"
**Solution:**
- Install Node.js from https://nodejs.org/

## 📚 Project Structure Breakdown

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python package dependencies
├── core/
│   ├── data_engine.py     # Stock data fetching & preprocessing
│   └── model.py           # LSTM neural network model
├── api/
│   └── routes.py          # API endpoint definitions
└── saved_models/          # Trained model storage

frontend/
├── package.json           # Node dependencies
├── index.html            # HTML entry point
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── src/
    ├── main.jsx          # React entry point
    ├── App.jsx           # Main React component
    ├── components/       # Reusable UI components
    ├── hooks/            # Custom React hooks
    ├── services/         # API service layer
    ├── pages/            # Page components
    └── utils/            # Helper utilities
```

## 🎯 Key Files to Understand

1. **backend/core/data_engine.py** - Data processing logic
2. **backend/core/model.py** - LSTM model architecture
3. **backend/api/routes.py** - API endpoint definitions
4. **frontend/src/pages/Dashboard.jsx** - Main UI component
5. **frontend/src/hooks/useApi.js** - Data fetching hooks
6. **frontend/src/services/apiService.js** - API communication

## 🧪 Testing Features

### Test the Forecast API

```python
# Save as: test_api.py in backend directory

import requests
import json

API_URL = "http://localhost:8000/api/v1"

# Test 1: Get Forecast
response = requests.post(f"{API_URL}/forecast", json={
    "ticker": "AAPL",
    "days_ahead": 5,
    "period": "1y"
})
print("Forecast Response:", json.dumps(response.json(), indent=2))

# Test 2: Validate Ticker
response = requests.get(f"{API_URL}/validate/AAPL")
print("Validation Response:", response.json())

# Test 3: Get Metrics
response = requests.get(f"{API_URL}/metrics/AAPL")
print("Metrics Response:", response.json())
```

Run with: `python test_api.py`

## 📊 Monitor Performance

### Check Backend Logs
```bash
# Logs appear in terminal where backend is running
# Look for [INFO], [WARNING], [ERROR] messages
```

### Check Frontend Console
```bash
# Open browser DevTools: F12
# View Console tab for any JavaScript errors
# Network tab shows API calls
```

## 🔒 Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure as needed:
```
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
VITE_API_URL=http://localhost:8000/api/v1
```

## 📦 Adding New Dependencies

### Python Package
```bash
cd backend
pip install <package-name>
pip freeze > requirements.txt
```

### Node Package
```bash
cd frontend
npm install <package-name>
```

## 🚀 Next Steps

1. **Train a Model**: Modify `backend/core/model.py` to train on new data
2. **Add Features**: Create new React components in `frontend/src/components/`
3. **Extend API**: Add endpoints in `backend/api/routes.py`
4. **Deploy**: Set up on a cloud platform (AWS, Azure, Heroku)

## 📞 Useful Commands

| Task | Command |
|------|---------|
| List Python packages | `pip list` |
| List Node packages | `npm list` |
| Update Python packages | `pip install --upgrade -r requirements.txt` |
| Update Node packages | `npm update` |
| Backend test | `python -m pytest backend/` |
| Frontend test | `npm test` |
| Check backend style | `pylint backend/*.py` |
| Format frontend code | `npm run format` |

## 🎓 Learning Resources

- **FastAPI**: https://fastapi.tiangolo.com/
- **TensorFlow**: https://www.tensorflow.org/tutorials
- **React**: https://react.dev/learn
- **Vite**: https://vitejs.dev/guide/
- **Tailwind CSS**: https://tailwindcss.com/docs

## ✅ Development Checklist

- [ ] Backend setup complete
- [ ] Frontend setup complete
- [ ] Both servers running
- [ ] API health check passes
- [ ] Can search for tickers
- [ ] Dashboard displays data
- [ ] Charts render correctly
- [ ] Export feature works
- [ ] No console errors

---

**Happy Coding! 🎉**
