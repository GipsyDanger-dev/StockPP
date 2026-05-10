# Stock Price Forecasting with LSTM Deep Learning

A full-stack web application for predicting stock prices using LSTM (Long Short-Term Memory) neural networks. This project combines a powerful FastAPI backend with an interactive React frontend to provide real-time stock price forecasting.

## 🎯 Project Overview

**Stock Price Forecasting Agent Guide** - V5 (Final Full-Stack)

Sistem prediksi harga saham berbasis Deep Learning (LSTM) dengan arsitektur Full-Stack modern yang memisahkan antara Engine Analisis dan Interface Pengguna.

### Key Features
- 📊 **LSTM Deep Learning Model** - Advanced neural network for time series prediction
- 📈 **Interactive Dashboard** - Real-time visualization of historical and forecasted prices
- 🎛️ **Control Panel** - Customize time periods and forecast duration
- 📉 **Performance Metrics** - RMSE and MAE indicators for model accuracy
- 📥 **Data Export** - Export forecasts as CSV and PDF
- 💻 **Modern UI** - Clean, professional interface with Tailwind CSS
- 🔄 **Real-time Updates** - Live data from yfinance
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🏗️ Project Structure

```
stock-forecast-project/
├── backend/
│   ├── main.py                # FastAPI entry point
│   ├── requirements.txt        # Python dependencies
│   ├── core/
│   │   ├── __init__.py
│   │   ├── model.py           # LSTM model architecture
│   │   └── data_engine.py     # Data fetching & preprocessing
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py          # API endpoints
│   └── saved_models/          # Model storage
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/        # React components
│       ├── hooks/            # Custom React hooks
│       ├── services/         # API service layer
│       ├── pages/            # Page components
│       └── utils/            # Utilities
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

## 📡 API Endpoints

### Core Endpoints

- **POST** `/api/v1/forecast` - Get stock price forecast
  ```json
  {
    "ticker": "AAPL",
    "days_ahead": 5,
    "period": "1y"
  }
  ```

- **GET** `/api/v1/forecast/{ticker}` - Simplified forecast endpoint
  - Query: `?days=5`

- **GET** `/api/v1/historical/{ticker}` - Get historical price data
  - Query: `?days=365`

- **GET** `/api/v1/metrics/{ticker}` - Get model performance metrics

- **GET** `/api/v1/validate/{ticker}` - Validate if ticker exists

- **GET** `/health` - Check API health status

## 🧠 Technical Architecture

### Backend (FastAPI)
- **Data Engine** (`data_engine.py`)
  - Fetches data using yfinance
  - Normalizes using MinMaxScaler (0-1 range)
  - Creates sliding window sequences (60-day window)
  - Handles inverse transformation

- **LSTM Model** (`model.py`)
  - 3 LSTM layers with 50 units each
  - Dropout layers (0.2) for regularization
  - Adam optimizer with MSE loss
  - Supports training and inference

### Frontend (React + Vite)
- **Components**
  - Header - Search and status
  - Sidebar - Control panel
  - Dashboard - Main analysis view
  - PriceChart - Interactive visualization
  - KPI Cards - Key metrics display
  - Footer - Disclaimer and info

- **Hooks (TanStack Query)**
  - useForecast - Fetch predictions
  - useHistoricalData - Fetch historical prices
  - useMetrics - Fetch model metrics
  - useValidateTicker - Validate tickers

- **Visualization**
  - Recharts - Interactive charts
  - Lucide React - Icons
  - Tailwind CSS - Styling

## 🔄 Data Flow

```
1. User searches for ticker (e.g., "AAPL")
   ↓
2. React sends request to FastAPI
   ↓
3. FastAPI fetches data via yfinance
   ↓
4. Data Engine preprocesses:
   - Extract closing prices
   - Normalize with MinMaxScaler
   - Create sequences (60-day window)
   ↓
5. LSTM Model predicts future prices
   ↓
6. Metrics calculated (RMSE, MAE)
   ↓
7. Response sent as JSON
   ↓
8. React renders interactive dashboard
```

## 📊 Performance Metrics

- **RMSE** (Root Mean Square Error) - Measures prediction deviation
- **MAE** (Mean Absolute Error) - Average prediction error
- **Trend Analysis** - Bullish/Bearish indicators
- **Confidence Level** - Based on historical accuracy

## ⚙️ Configuration

### Backend Configuration
- Window size: 60 days (LSTM sequence length)
- Train/test split: 80/20
- Epochs: 50
- Batch size: 32
- Normalization: MinMaxScaler (0-1)

### Frontend Configuration
- Dev server: `http://localhost:5173`
- API proxy: `http://localhost:8000`
- Cache duration: 5-10 minutes
- Stale time: 5 minutes

## 🚨 Important Disclaimer

**⚠️ DISCLAIMER:** This tool is for technical analysis purposes only and does not constitute financial advice.

- Stock prices are inherently unpredictable
- LSTM predictions may contain significant errors
- Past performance does not guarantee future results
- Always consult with a financial advisor before making investment decisions
- Use at your own risk

## 📚 Dependencies

### Backend
- fastapi==0.104.1
- tensorflow==2.14.0
- scikit-learn==1.3.2
- pandas==2.1.1
- yfinance==0.2.32
- uvicorn==0.24.0

### Frontend
- react==18.2.0
- react-query==5.25.0
- recharts==2.10.0
- tailwindcss==3.3.0
- vite==5.0.0

## 🎨 UI/UX Features

- **Professional Design** - Clean slate dark mode theme
- **Responsive Layout** - Mobile-first design
- **Real-time Status** - API health indicator
- **Loading States** - Skeleton loaders
- **Error Handling** - User-friendly error messages
- **Export Options** - CSV and PDF download
- **Interactive Charts** - Zoom, pan, hover tooltips
- **Data Table** - Detailed forecast breakdown

## 🔐 Security Notes

- API runs on localhost by default
- CORS enabled for local development
- No authentication required (local use)
- Input validation on all endpoints
- Error messages don't expose sensitive info

## 📝 Model Training

```python
from backend.core import DataEngine, LSTMModel

# Initialize engine
engine = DataEngine(window_size=60)

# Fetch and prepare data
data = engine.fetch_data('AAPL', period='5y')
scaled_data = engine.prepare_data(data)
X, y = engine.create_sequences(scaled_data)

# Initialize and train model
model = LSTMModel(window_size=60)
model.build_model()
model.train(X_train, y_train, epochs=50)
model.save_model()

# Make predictions
predictions = model.predict(X_test)
metrics = model.evaluate(X_test, y_test)
```

## 🐛 Troubleshooting

### Backend Issues
- Port 8000 already in use: `netstat -ano | findstr :8000`
- TensorFlow not found: `pip install tensorflow`
- yfinance error: `pip install --upgrade yfinance`

### Frontend Issues
- Port 5173 already in use: Kill process or use `npm run dev -- --port 3000`
- Module not found: Run `npm install`
- API not responding: Ensure backend is running on port 8000

### Model Issues
- Poor predictions: Use more data or adjust window size
- Out of memory: Reduce batch size or use smaller dataset
- Slow training: Use GPU if available

## 📖 Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TensorFlow/Keras Guide](https://www.tensorflow.org/guide)
- [React Documentation](https://react.dev/)
- [Recharts Examples](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📄 License

This project is provided as-is for educational purposes.

## 👨‍💻 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📞 Support

For questions or issues, please create an issue on the project repository.

---

**Last Updated:** May 2026
**Version:** 1.0.0 (Production Ready)
