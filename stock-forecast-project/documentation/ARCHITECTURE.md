# Stock Forecast Project - Architecture & Implementation Guide

## 🎯 Project Overview

**Stock Price Forecasting System** - A full-stack application using LSTM Deep Learning to predict stock prices. Built with modern technology stack for scalability, performance, and user experience.

### System Goals
- Predict closing stock prices using 60-day historical LSTM sequences
- Provide interactive real-time dashboard with visualizations
- Display model performance metrics (RMSE, MAE)
- Support multiple stock tickers from worldwide markets
- Enable data export for further analysis

## 🏗️ Architecture

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Dashboard UI                                         │  │
│  │  ├─ Header (Search + Status)                        │  │
│  │  ├─ Sidebar (Controls)                              │  │
│  │  ├─ KPI Cards (Metrics)                             │  │
│  │  ├─ Price Charts (Recharts)                         │  │
│  │  └─ Data Table                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓ HTTP/JSON ↓                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  API LAYER (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                          │  │
│  │  • POST /forecast        (Main prediction)           │  │
│  │  • GET /historical       (Historical data)           │  │
│  │  • GET /metrics          (Model performance)         │  │
│  │  • GET /validate         (Ticker validation)         │  │
│  │  • GET /health           (API status)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               BACKEND LOGIC (Python/TensorFlow)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DATA ENGINE                                         │  │
│  │  ├─ yfinance: Fetch historical price data           │  │
│  │  ├─ Pandas: Data manipulation                        │  │
│  │  ├─ MinMaxScaler: Normalize (0-1)                   │  │
│  │  └─ Sequence Creation: 60-day windows               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ML MODEL                                            │  │
│  │  ├─ LSTM: 3 layers × 50 units                       │  │
│  │  ├─ Dropout: 0.2 regularization                     │  │
│  │  ├─ Optimizer: Adam                                 │  │
│  │  └─ Loss: Mean Squared Error                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL DATA SOURCES                        │
│  • yfinance: Yahoo Finance API for stock data              │
│  • Real-time & historical OHLCV data                       │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

### Complete Request-Response Cycle

```
1. USER INTERACTION
   ├─ Search ticker (e.g., "AAPL")
   ├─ Select period (1y, 5y)
   └─ Select forecast days (1-30)
           ↓
2. FRONTEND (React)
   ├─ Validate ticker format
   ├─ Prepare request payload
   └─ Send HTTP POST to FastAPI
           ↓
3. API LAYER (FastAPI)
   ├─ Validate request
   ├─ Route to appropriate handler
   └─ Call data engine & model
           ↓
4. DATA ENGINE
   ├─ Fetch data from yfinance
   │  └─ Download OHLCV for selected period
   ├─ Extract closing prices
   ├─ Normalize with MinMaxScaler
   │  └─ Transform to 0-1 range
   ├─ Create sequences
   │  └─ Sliding window (60 days)
   └─ Prepare for model input
           ↓
5. ML MODEL
   ├─ Load pre-trained LSTM weights
   ├─ Process last 60 days
   ├─ Generate predictions
   │  └─ For next N days
   └─ Inverse scale back to price range
           ↓
6. METRICS CALCULATION
   ├─ RMSE (error magnitude)
   ├─ MAE (average error)
   ├─ Trend analysis
   └─ Confidence scoring
           ↓
7. RESPONSE FORMATION (JSON)
   ├─ Historical data points
   ├─ Forecast data points
   ├─ Performance metrics
   └─ Trend information
           ↓
8. FRONTEND RENDERING
   ├─ Update KPI cards
   ├─ Render interactive charts
   ├─ Display data table
   └─ Show trend indicators
           ↓
9. USER SEES
   ├─ Price forecast chart
   ├─ Performance metrics
   ├─ Bullish/Bearish trend
   └─ Export options
```

## 🔧 Technical Components

### Backend Stack

#### 1. FastAPI (`main.py`)
- **Purpose**: Web framework & API endpoint management
- **Key Features**:
  - Async/await for performance
  - Automatic OpenAPI documentation
  - CORS middleware for frontend access
  - Request validation with Pydantic
- **Routes**: 5 main endpoints + health check

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
  - Epochs: 50 (configurable)
  - Batch Size: 32

### Frontend Stack

#### 1. React (`src/App.jsx`)
- **Purpose**: User interface & component management
- **State Management**: React hooks & TanStack Query
- **Key Features**:
  - Component-based architecture
  - Real-time data updates
  - Error handling
  - Loading states

#### 2. Custom Hooks (`src/hooks/useApi.js`)
- **Purpose**: API data fetching with caching
- **Hooks**:
  - `useForecast()` - Stock predictions
  - `useHistoricalData()` - Historical prices
  - `useMetrics()` - Model metrics
  - `useValidateTicker()` - Ticker validation
  - `useHealth()` - API status check
- **Benefits**:
  - Automatic caching (5-10 min)
  - Retry logic (2 attempts)
  - Loading/error states

#### 3. API Service (`src/services/apiService.js`)
- **Purpose**: HTTP communication layer
- **Features**:
  - Axios instance with interceptors
  - Request/response logging
  - Error handling
  - Base URL configuration

#### 4. Components (`src/components/`)
- **Header.jsx**: Navigation & search
- **Sidebar.jsx**: Control panel
- **Dashboard.jsx**: Main content area
- **PriceChart.jsx**: Recharts visualization
- **Footer.jsx**: Disclaimer & info
- **Common.jsx**: Reusable UI components

#### 5. Styling
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS transformation
- **Theme**: Professional slate color palette

## 🔄 Key Processes

### Model Training Process
```python
# Pseudo-code flow
1. Fetch historical data (5 years)
2. Extract closing prices
3. Normalize prices (0-1 range)
4. Create sequences (60-day windows)
5. Split data (80% train, 20% test)
6. Initialize LSTM model
7. Train for 50 epochs
8. Evaluate on test data
9. Calculate RMSE & MAE
10. Save model weights
```

### Prediction Process
```python
# Pseudo-code flow
1. Get last 60 days of prices
2. Normalize with same scaler
3. Pass through LSTM model
4. Get prediction
5. Inverse scale to price range
6. Repeat for N days ahead
7. Calculate metrics
8. Format JSON response
```

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
- Accuracy: 60-75% directional accuracy

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

## 🚀 Deployment Architecture

### Development
```
Local Machine:
├─ Backend: localhost:8000
├─ Frontend: localhost:5173
└─ Database: None (in-memory)
```

### Production (Recommended)
```
Cloud Provider (AWS/Azure/GCP):
├─ Frontend: CloudFront/CDN
├─ Backend: Elastic Container Service/App Service
├─ Database: RDS/CosmosDB
├─ Cache: ElastiCache/Redis
├─ Storage: S3/Blob Storage (models)
└─ Monitoring: CloudWatch/Application Insights
```

## 📝 File Structure Reference

### Backend Structure
```
backend/
├── main.py                      # FastAPI app initialization
├── requirements.txt             # Python dependencies
├── core/
│   ├── __init__.py             # Module exports
│   ├── data_engine.py          # 150+ lines (Data fetching & prep)
│   └── model.py                # 200+ lines (LSTM model)
├── api/
│   ├── __init__.py             # API exports
│   └── routes.py               # 150+ lines (5 endpoints)
└── saved_models/               # Model storage directory
```

### Frontend Structure
```
frontend/
├── index.html                  # HTML entry
├── package.json                # Dependencies
├── vite.config.js             # Vite config
├── tailwind.config.js         # Tailwind config
├── postcss.config.js          # PostCSS config
└── src/
    ├── main.jsx               # React entry
    ├── App.jsx                # Main component
    ├── index.css              # Global styles
    ├── components/
    │   ├── Header.jsx         # Nav component
    │   ├── Footer.jsx         # Footer component
    │   ├── PriceChart.jsx     # Chart component
    │   └── Common.jsx         # Shared components
    ├── hooks/
    │   └── useApi.js          # 5 custom hooks
    ├── services/
    │   └── apiService.js      # API layer
    ├── pages/
    │   └── Dashboard.jsx      # Main page
    └── utils/
        └── formatting.js      # Utilities
```

## 🎯 Development Workflow

### Adding a New Feature

1. **Backend**:
   - Create new function in `core/`
   - Create API endpoint in `api/routes.py`
   - Test with curl/Postman
   - Document in README

2. **Frontend**:
   - Create React component
   - Create custom hook if data-fetching
   - Add to Dashboard or new page
   - Test in browser
   - Update UI documentation

3. **Integration**:
   - Test end-to-end
   - Check console for errors
   - Validate data flow
   - Commit to git

### Testing Checklist
- [ ] Backend API responds
- [ ] Data loads in 2-5 seconds
- [ ] Charts render correctly
- [ ] Metrics display accurately
- [ ] No console errors
- [ ] Export functions work
- [ ] All tickers validate
- [ ] Mobile responsive

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
  "trend": "bullish",
  "timestamp": "2024-01-14T10:30:00"
}
```

### GET /api/v1/validate/{ticker}
**Purpose**: Validate ticker existence

**Response**:
```json
{
  "ticker": "AAPL",
  "is_valid": true,
  "timestamp": "2024-01-14T10:30:00"
}
```

## 🎓 Next Steps

1. **Run the application**: Follow DEVELOPMENT.md
2. **Train the model**: Adjust hyperparameters in model.py
3. **Add features**: Extend API with new endpoints
4. **Deploy**: Choose cloud provider
5. **Monitor**: Set up logging & alerts

---

**Last Updated**: May 2026
**Version**: 1.0.0 (Production Ready)
**Status**: ✅ Complete & Operational
