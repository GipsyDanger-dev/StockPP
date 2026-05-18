# Laporan Pemahaman Project — Precision Analytics (Stock Forecast AI)

> Tanggal: 2026-05-18
> Status: Post-Audit (Dummy Data Clean)

---

## 1. ARSITEKTUR OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│  Port 5173 │ TanStack Query │ Recharts │ Tailwind CSS       │
│  5 Pages: Dashboard, Analytics, Market, Reports, Insights   │
└──────────────────────┬──────────────────────────────────────┘
                       │ Axios HTTP (REST API)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Python)                 │
│  Port 8000 │ 15 Endpoints │ Lazy singleton services          │
│  Services: ForecastingService, DataEngine, ModelManager      │
│            RetrainingOrchestrator, InsightEngine              │
└────────┬──────────────────┬─────────────────────────────────┘
         │                  │
         ▼                  ▼
┌────────────────┐  ┌───────────────────────────────────────┐
│   yfinance     │  │           Supabase                     │
│  (Yahoo API)   │  │  PostgreSQL: tickers, training_logs    │
│  Historical    │  │  Storage: models/{TICKER}/model.keras   │
│  + Live data   │  │  Cloud backup for all trained models    │
└────────────────┘  └───────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│              ML PIPELINE (TensorFlow/Keras LSTM)              │
│  3-Layer LSTM (50 units) │ 6 Features │ Window=20 days       │
│  Walk-Forward Validation │ RMSE 2% Tolerance │ Auto-retrain   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. BACKEND — DETAIL ANALYSIS

### 2.1 Entry Point — `main.py`

- FastAPI app dengan CORS `allow_origins=["*"]` (sesuai CLAUDE.md)
- Router dipasang di prefix `/api/v1`
- Tidak ada startup event — semua service lazy-initialized pada request pertama
- Dijalankan via `uvicorn` di `127.0.0.1:8000`

### 2.2 API Endpoints (15 total)

| # | Method | Endpoint | Fungsi |
|---|--------|----------|--------|
| 1 | POST | `/forecast` | Full forecast (ticker, days_ahead, period) |
| 2 | GET | `/forecast/{ticker}` | Simplified forecast (query: days) |
| 3 | GET | `/validate/{ticker}` | Validasi ticker exists di yfinance |
| 4 | GET | `/search/{query}` | Cari ticker via Finnhub |
| 5 | GET | `/quote/{ticker}` | Live price quote (Finnhub → yfinance fallback) |
| 6 | GET | `/historical/{ticker}` | Historical price data (30-3650 days) |
| 7 | GET | `/metrics/{ticker}` | Model metrics (RMSE, MAE) |
| 8 | POST | `/retrain/{ticker}` | Manual trigger retraining |
| 9 | GET | `/retrain/status/{ticker}` | Cek status retraining |
| 10 | GET | `/models/status` | Status semua model |
| 11 | POST | `/batch-retrain` | Batch retrain multiple tickers |
| 12 | GET | `/market/summary` | Market overview (Supabase tickers + Finnhub quotes) |
| 13 | GET | `/reports/history` | Training history dari Supabase |
| 14 | GET | `/health/database` | Health check Supabase |
| 15 | GET | `/insights` | AI-driven market insights |

### 2.3 Services Architecture

#### DataEngine — Data pipeline:
- Fetch data dari yfinance (OHLCV)
- Hitung 6 technical indicators: Close, Volume, MA20, MA50, RSI, MACD
- Normalize dengan MinMaxScaler(0,1)
- Create sliding window sequences (window=20)

#### FinnhubClient — Real-time data:
- Singleton pattern
- `get_quote()` — live price
- `get_company_info()` — nama, sektor, negara
- `search_symbol()` — cari ticker
- Fallback ke yfinance untuk ticker `.JK` (Indonesia)

#### ForecastingService — Orchestrator utama:
- Cache in-memory (1 TTL jam)
- Auto-train jika model belum ada (70 epochs, 5y data)
- Multi-step prediction: sliding window → predict → append → repeat
- Return: historical, forecast, indicators, metrics, trend

#### LSTMModel — Neural network:
- 3-layer LSTM (50 units each, Dropout 0.2)
- Input: (20, 6) → Output: 1 (Close price)
- Adam optimizer, MSE loss, MAE metric

#### ModelManager — Lifecycle management:
- Save: `.keras` + pickle scaler + metadata JSON
- Upload ke Supabase Storage
- Insert training log ke `training_logs` table
- Versioning: keep last 5 versions
- RMSE comparison: 2% tolerance

#### RetrainingOrchestrator — Retraining workflow:
- Walk-forward validation (5 folds, expanding window)
- 80/20 train/test split
- Compare dengan model lama (2% RMSE tolerance)
- Save jika lebih baik

#### InsightEngine — Dynamic insights:
- Generate featured article dari best model
- 4 insight cards (training status, coverage, best model, recommendation)
- Market summary (total models, avg RMSE, retrain status)

#### ModelScheduler — Background scheduler:
- Menggunakan `schedule` library
- Support daily, weekly, periodic retrain
- **BELUM diaktifkan** di `main.py` — defined but not started

### 2.4 Database Schema (Supabase)

#### Table `tickers`:
- `symbol`, `name`, `sector`, `is_active` (boolean), `last_trained_at`
- Di-seed via `seed_data.py` (8 saham awal)

#### Table `training_logs`:
- `id`, `ticker`, `report_name`, `rmse`, `mae`, `r_square`, `accuracy`, `status`, `created_at`, `training_samples`
- Status: "Completed", "Processing", "Failed"

#### Storage bucket `models`:
- Path: `{TICKER}/model.keras`
- Upload setelah training, download saat load

### 2.5 Model yang Sudah Di-train

| Ticker | RMSE | MAE | Trained |
|--------|------|-----|---------|
| AAPL | 0.0292 | 0.0227 | 2026-05-18 |
| NVDA | 0.0984 | 0.0907 | 2026-05-18 |
| AMZN | 0.0647 | 0.0537 | 2026-05-18 |
| BMRI.JK | 0.0368 | 0.0294 | 2026-05-18 |
| AMD | 0.0407 | 0.0276 | 2026-05-18 |

---

## 3. FRONTEND — DETAIL ANALYSIS

### 3.1 Routing

| Path | Page | Fungsi |
|------|------|--------|
| `/` | Dashboard | Landing page, default ticker NVDA, 7-day forecast |
| `/analytics` | AnalyticsOverview | Stock picker, top gainers/losers |
| `/analytics/:ticker` | AnalyticsDetail | Technical analysis per saham |
| `/market` | Market | Market explorer, sector filter, search |
| `/reports` | Reports | Training history dari Supabase |
| `/insights` | Insights | AI-generated market insights |

### 3.2 Data Flow

```
Page Component
    ↓
useApi.js (TanStack Query hooks, 11 hooks)
    ↓
apiService.js (Axios client, 11 methods)
    ↓
FastAPI Backend (/api/v1/*)
    ↓
Services → yfinance / Finnhub / Supabase / LSTM Model
```

### 3.3 Component Architecture

#### Layout — App shell:
- Fixed sidebar (256px) dengan navigasi 5 halaman
- Responsive: slide-in/out di mobile (<1024px)
- Top bar dengan hamburger toggle

#### PriceChart — Recharts ComposedChart:
- Area chart untuk actual price (indigo)
- Line chart dashed untuk forecast (emerald)
- MA20 (orange) dan MA50 (sky blue) overlays
- Reference line "Today" sebagai pemisah

#### Common.jsx — 6 reusable components:
- KPICard, MetricBadge, StatusBadge, Skeleton, ErrorAlert, SuccessAlert
- **Catatan:** Semua exported tapi TIDAK digunakan di halaman manapun

### 3.4 Per-Page Detail

#### Dashboard:
- Default ticker: NVDA
- Fetch: `useForecast(ticker, 7, '1y')`
- Hero section + Chart (2/3) + AI Prediction card (1/3)
- 7-Day Forecast Table dengan change percentage
- RMSE → accuracy percent: `100 - rmse*100`

#### Analytics (Overview):
- Top Movers: gainers/losers dari market summary
- Live search via Finnhub (debounced 500ms)
- Watchlist table dari Supabase tickers

#### Analytics (Detail):
- Live quote refresh setiap 30 detik
- Technical indicators: RSI (0-100 progress bar), MA crossover, MACD momentum
- Model metrics: RMSE, MAE, model source
- Signal interpretation: Oversold/Overbought, Bullish/Bearish Crossover

#### Market:
- Sector filter dinamis dari data
- Dual mode: search results (Finnhub) vs watchlist (Supabase)
- Filter by sector + search term

#### Reports:
- Fetch: `useReportsHistory(null, 50, true)`
- Stat cards: Total, Completed, Processing
- Filter by search term + status dropdown

#### Insights:
- Fetch: `useInsights(true)`
- Featured article + 4 insight cards
- Summary badges: models count, retrain status, avg RMSE
- CTA untuk training model

### 3.5 Hooks (TanStack Query)

| Hook | Stale Time | Usage |
|------|-----------|-------|
| `useForecast` | 5 min | Dashboard, Analytics Detail |
| `useMarketSummary` | 2 min | Analytics Overview, Market |
| `useReportsHistory` | 5 min | Reports |
| `useInsights` | 5 min | Insights |
| `useQuote` | 30 sec | (defined, not used — Analytics uses direct axios) |
| 6 lainnya | various | Defined but unused |

---

## 4. DATA FLOW END-TO-END

### Contoh: User buka Dashboard

1. User navigasi ke `/`
2. Dashboard renders, `useForecast("NVDA", 7, "1y")` fires
3. TanStack Query checks cache → miss → calls `apiService.getForecast("NVDA", 7, "1y")`
4. Axios POST ke `http://localhost:8000/api/v1/forecast`
5. Backend `ForecastingService.predict("NVDA", 7, "1y")`:
   - Check in-memory cache → miss
   - Load model `NVDA_current.keras` + scaler
   - Fetch fresh data dari yfinance
   - Add technical indicators
   - Scale features, run LSTM prediction (7 steps)
   - Inverse transform predictions
   - Cache result, return response
6. Frontend receives data → renders PriceChart + forecast table + AI prediction card

### Contoh: User trigger retrain

1. User click "Retrain" di Analytics Detail
2. Axios POST ke `/api/v1/retrain/AAPL`
3. Backend creates `RetrainingOrchestrator`:
   - Fetch 1y data dari yfinance
   - Walk-forward validation (5 folds)
   - Train final model (10 epochs)
   - Compare RMSE dengan model lama (2% tolerance)
   - Save if better → upload ke Supabase
4. Return status: success/failed/skipped

---

## 5. TEMUAN PENTING & OBSERVASI

### Sudah Bersih (Post-Audit)

- Tidak ada dummy data tersisa
- Semua data dari Supabase, yfinance, atau Finnhub
- Fallback error handling: null/empty data dengan status "error"
- Ticker list dari Supabase (bukan hardcoded)
- Sector filter dinamis dari data

### Potensi Issues yang Perlu Diperhatikan

1. **Scaler re-fit setiap prediction** — `ForecastingService.predict()` melakukan `fit_transform()` pada scaler baru setiap kali, bukan menggunakan saved scaler untuk transform. Saved scaler hanya digunakan untuk inverse transform. Ini bisa menyebabkan inkonsistensi prediksi.

2. **ModelScheduler tidak aktif** — `model_scheduler.py` sudah didefinisikan tapi tidak di-start di `main.py`. Tidak ada background retraining otomatis.

3. **Direct axios di pages** — `Analytics.jsx` dan `Market.jsx` membuat axios call langsung (untuk search dan live quote) bypassing `apiService.js` dan TanStack Query hooks.

4. **Unused components** — `Header`, `Sidebar`, `Footer`, `CompactFooter`, `Common.jsx` components, dan 6 dari 11 hooks tidak digunakan.

5. **Unused dependency** — `date-fns` di `package.json` tapi tidak pernah di-import.

6. **Dual color system** — Tailwind named colors dan hardcoded hex values (`#191C1E`, `#0D1C2F`, dll) coexist.

7. **`train_aapl.py`** — Duplicate dari `run_first_train.py`.

---

## 6. SUMMARY

Project ini adalah **full-stack ML-powered stock forecasting app** dengan arsitektur yang solid:

- **Backend**: 15 REST endpoints, 8 service classes, LSTM pipeline dengan walk-forward validation, Supabase untuk persistence
- **Frontend**: 5 halaman, TanStack Query untuk caching, Recharts untuk visualisasi
- **ML Pipeline**: 6 technical indicators, 3-layer LSTM, RMSE-based model selection dengan 2% tolerance
- **Data Sources**: yfinance (historical), Finnhub (real-time), Supabase (storage + metadata)

Audit dummy data sudah selesai dan bersih. Semua data sekarang bersifat dinamis dari sumber asli.
