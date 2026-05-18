# 🔍 Complete Codebase Audit & Next Steps

**Date**: May 17, 2026
**Auditor**: Automated Code Review
**Version Reviewed**: 1.0.0 (Commit `0aac60b`)

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Backend Audit](#backend-audit)
3. [Frontend Audit](#frontend-audit)
4. [Documentation Audit](#documentation-audit)
5. [Critical Bugs](#critical-bugs)
6. [Warnings & Code Smells](#warnings--code-smells)
7. [Action Items (Priority Order)](#action-items-priority-order)

---

## Executive Summary

The codebase implements a full-stack stock price forecasting system with LSTM deep learning. It has **good architectural separation** between backend (Python/FastAPI) and frontend (React/Vite). The project has grown beyond its original documentation, with several new modules (ForecastingService, ModelManager, ModelScheduler, RetrainingOrchestrator, SupabaseClient) that are not reflected in existing docs.

**Overall Grade**: B+ (Good foundation, needs bug fixes + static data integration)

**Strengths**:
- ✅ Clean modular architecture with separation of concerns
- ✅ Graceful degradation (mock data fallback when no model exists)
- ✅ Caching at multiple layers (in-memory + browser)
- ✅ Supabase cloud integration for model persistence
- ✅ Automated model retraining pipeline with validation
- ✅ Modern UI with Tailwind CSS and responsive design

**Weaknesses**:
- ❌ **3 bugs found** (non-existent method calls)
- ❌ Static/Hardcoded data in 3 frontend pages
- ❌ Outdated documentation in README.md and DEVELOPMENT.md
- ❌ Missing TypeScript types
- ❌ No automated tests for frontend
- ❌ No CI/CD pipeline

---

## Backend Audit

### File Inventory & Status

| File | LOC | Status | Notes |
|------|-----|--------|-------|
| `main.py` | 50 | ✅ Good | Clean FastAPI setup with CORS |
| `core/__init__.py` | 5 | ⚠️ Incomplete | Missing exports for 5 modules |
| `core/data_engine.py` | 121 | ✅ Good | Clean yfinance integration |
| `core/model.py` | 229 | ✅ Good | Well-structured LSTM |
| `core/forecasting_service.py` | 202 | ⚠️ Has bug | Calls non-existent method (see Critical Bugs) |
| `core/model_manager.py` | 305 | ⚠️ Has bug | Missing `load_model_and_scaler()` method |
| `core/model_scheduler.py` | 184 | ✅ Good | Clean scheduling with background thread |
| `core/retraining_orchestrator.py` | 238 | ⚠️ Has bug | Calls `save_model(ticker, metrics, scaler)` with 3 args but method signature accepts 3 params without scaler — check if model_manager.save_model() accepts scaler |
| `core/supabase_client.py` | 215 | ✅ Good | Clean singleton pattern |
| `api/routes.py` | 512 | ⚠️ Has bug | Calls non-existent `service.get_metrics()` |
| `api/__init__.py` | 4 | ✅ Good | Clean re-exports |
| `test/test_ai.py` | 16 | ⚠️ Has bug | Calls non-existent method |
| `test_prediction.py` | 25 | ⚠️ Has bug | Calls non-existent method |
| `train_aapl.py` | 16 | ✅ Good | Works correctly |
| `run_first_train.py` | 34 | ✅ Good | Works correctly |
| `check_db.py` | 28 | ✅ Good | Utility script |

### Backend Issues Detail

#### 1. `core/__init__.py` — Incomplete Exports
```python
# Currently exports only:
from .model import LSTMModel
from .data_engine import DataEngine

# Missing:
# from .forecasting_service import ForecastingService
# from .model_manager import ModelManager
# from .model_scheduler import ModelScheduler
# from .retraining_orchestrator import RetrainingOrchestrator
```

**Impact**: `from core import ForecastingService` will fail. Developers must import from full path.

#### 2. `retraining_orchestrator.py` — save_model() call mismatch
Line 128-133 in `retraining_orchestrator.py`:
```python
saved = self.model_manager.save_model(
    model.model,
    ticker_upper,
    new_metrics,
    scaler  # <-- 4th argument passed
)
```
But `ModelManager.save_model()` signature is:
```python
def save_model(self, model, ticker: str, metrics: Dict) -> bool:
```
This will raise a `TypeError: save_model() takes 4 positional arguments but 5 were given`.

### Backend Code Quality
- **Logging**: ✅ Excellent — consistent use of `logging` with proper levels
- **Error Handling**: ✅ Good — try/except blocks, fallback to mock data
- **Type Hints**: ✅ Good — most functions have proper type annotations
- **Docstrings**: ⚠️ Partial — some methods lack Args/Returns documentation
- **Naming**: ✅ Good — snake_case, descriptive names
- **Imports**: ⚠️ Inline imports in routes.py (`from core.supabase_client import ...`) should be at top-level

---

## Frontend Audit

### File Inventory & Status

| File | LOC | Status | Notes |
|------|-----|--------|-------|
| `src/App.jsx` | 28 | ✅ Good | Clean router setup, 5 routes |
| `src/pages/Dashboard.jsx` | 291 | ⚠️ Static data | Hardcoded signal data |
| `src/pages/Analytics.jsx` | 108 | ⚠️ Static data | Hardcoded scores/indicators |
| `src/pages/Reports.jsx` | 258 | ✅ Good | Proper Supabase integration |
| `src/pages/Insights.jsx` | 101 | ⚠️ Static page | No API integration, hardcoded blog posts |
| `src/pages/Market.jsx` | 142 | ✅ Good | Proper Supabase integration |
| `src/hooks/useApi.js` | 105 | ✅ Good | Clean TanStack Query hooks |
| `src/services/apiService.js` | 167 | ✅ Good | Well-structured Axios client |
| `src/components/PriceChart.jsx` | - | ✅ Good | Recharts visualization |
| `src/utils/formatting.js` | 11 | ✅ Good | Clean utility functions |

### Frontend Issues Detail

#### 1. Dashboard.jsx — Hardcoded Signal Data (Lines 226-254)
```jsx
<SignalRow ticker="TSLA" action="SELL" ... />
<SignalRow ticker="MSFT" action="BUY" ... />
<SignalRow ticker="AAPL" action="HOLD" ... />
```
**Fix**: Fetch signal data from API or remove the table if not implemented.

#### 2. Analytics.jsx — Hardcoded Technical Indicators (Lines 82-86)
```jsx
<TechRow label="MA (50)" value={formatCurrency(data.current_price * 0.96)} />
<TechRow label="MA (200)" value={formatCurrency(data.current_price * 0.92)} />
<TechRow label="RSI (14)" value="62.4" />
<TechRow label="MACD" value="Bullish Cross" isBadge />
```
**Fix**: These should come from the backend prediction response or a new endpoint.

#### 3. Insights.jsx — Fully Static Page (Lines 35-89)
- Hardcoded blog posts with Unsplash images
- No API calls at all
- Date "Oct 24, 2023" is outdated
- Premium report section has no functionality

**Decision**: Either remove this page or implement real insights from the ML model.

### Frontend Code Quality
- **Component Structure**: ✅ Good — well-organized into pages/components/hooks
- **State Management**: ✅ Good — TanStack Query with proper stale times
- **Error Handling**: ✅ Good — loading states, error boundaries in pages
- **Styling**: ✅ Excellent — consistent Tailwind with custom color palette
- **Responsiveness**: ✅ Good — mobile sidebar, responsive grids
- **No TypeScript**: ⚠️ All `.jsx` — no type safety
- **No Tests**: ⚠️ No Jest or React Testing Library files

---

## Documentation Audit

### File Inventory

| File | Status | Notes |
|------|--------|-------|
| `README.md` | ❌ Outdated | Missing 5 backend modules, wrong structure |
| `documentation/ARCHITECTURE.md` | ✅ Updated | Just revised with complete coverage |
| `documentation/DEVELOPMENT.md` | ❌ Outdated | Structure doesn't match actual files |
| `documentation/db.md` | ✅ Good | Supabase schema details |
| `FRONTEND_INTEGRATION_COMPLETE.md` | ⚠️ | Checklist file, might need review |

### Documentation Issues

#### README.md (318 lines, severely outdated)
- **File structure (lines 22-52)**: Shows only 2 core modules (`model.py`, `data_engine.py`). Missing: `forecasting_service.py`, `model_manager.py`, `model_scheduler.py`, `retraining_orchestrator.py`, `supabase_client.py`, `train_aapl.py`, `run_first_train.py`, `check_db.py`, `test/`, `test_prediction.py`
- **API Endpoints (lines 106-126)**: Missing 6 new endpoints: `/retrain/{ticker}`, `/retrain/status/{ticker}`, `/models/status`, `/batch-retrain`, `/market/summary`, `/reports/history`, `/health/database`
- **Technical Architecture (lines 130-142)**: Only mentions DataEngine and LSTMModel
- **Hooks (lines 152-157)**: Missing `useMarketSummary`, `useReportsHistory`, `useDatabaseHealth`
- **Dependencies (lines 221-234)**: Missing `supabase`, `python-dotenv`, `schedule`, `react-router-dom`, `lucide-react`, `axios`
- **Security Notes (lines 248-254)**: Missing mention of `.env` file for Supabase credentials
- **Model Training (lines 256-276)**: Shows outdated API using `DataEngine` directly instead of `RetrainingOrchestrator`

#### DEVELOPMENT.md (314 lines, partially outdated)
- **Project Structure (lines 162-186)**: Same issue — only 2 core modules shown
- **Key Files (lines 188-196)**: Only lists 6 files, missing many important ones
- **Environment Variables (lines 243-255)**: Missing `SUPABASE_URL`, `SUPABASE_KEY`, `WINDOW_SIZE`, `CORS_ORIGINS`
- **Testing (lines 198-224)**: No mention of Supabase setup or database health checks
- **Development Checklist (lines 302-310)**: Missing Supabase setup, model training steps

---

## 🔴 Critical Bugs

### Bug 1: `forecasting_service.py` calls `load_model_and_scaler()` — Method Does Not Exist
**File**: `backend/core/forecasting_service.py`, Line 48
```python
model, saved_scaler = self.model_manager.load_model_and_scaler(ticker_upper)
```
**Problem**: `ModelManager` in `model_manager.py` has `load_model()` but NO `load_model_and_scaler()` method.
**Impact**: Prediction will crash with `AttributeError` when a persisted model exists.
**Fix**: Add `load_model_and_scaler()` method to `ModelManager`:
```python
def load_model_and_scaler(self, ticker: str) -> Tuple[Optional[object], Optional[Any]]:
    model = self.load_model(ticker)
    scaler = self._load_scaler(ticker)  # Need to implement scaler persistence
    return model, scaler
```
**Note**: This also requires saving/loading the scaler, which currently only uses `MinMaxScaler` without persistence. The `ModelManager.save_model()` needs to save the scaler alongside the model.

### Bug 2: `test_prediction.py` calls `get_forecast()` — Method Does Not Exist
**File**: `backend/test_prediction.py`, Line 9
```python
result = service.get_forecast("AAPL")
```
**Problem**: `ForecastingService` has `predict()`, not `get_forecast()`.
**Impact**: Script crashes on execution.
**Fix**: Change to `service.predict("AAPL")`.

### Bug 3: `api/routes.py` calls `service.get_metrics()` — Method Does Not Exist
**File**: `backend/api/routes.py`, Line 212
```python
metrics = service.get_metrics(ticker)
```
**Problem**: `ForecastingService` has no `get_metrics()` method.
**Impact**: The `/metrics/{ticker}` endpoint always returns 500 error.
**Fix**: Either add `get_metrics()` to `ForecastingService` or call `service.model_manager.get_model_metrics()` directly.

### Bug 4: `retraining_orchestrator.py` passes 4 args to `save_model()` but signature accepts 3
**File**: `backend/core/retraining_orchestrator.py`, Lines 128-133
```python
saved = self.model_manager.save_model(
    model.model,
    ticker_upper,
    new_metrics,
    scaler  # <-- 4th argument will raise TypeError
)
```
**Problem**: `ModelManager.save_model(self, model, ticker, metrics)` has 3 positional params + self.
**Impact**: Retraining crashes on successful training.
**Fix**: Update `save_model()` to accept optional `scaler` parameter, or save scaler separately.

---

## 🟡 Warnings & Code Smells

### 1. API Key in `.env` File
**File**: `backend/.env`
**Risk**: If this file is committed to git, Supabase credentials are exposed.
**Check**: Verify `.gitignore` excludes `.env`. Consider using environment variables or GitHub Secrets for deployment.

### 2. Inline Imports in `routes.py`
**File**: `backend/api/routes.py`, Lines 241, 373, 446, 490
```python
from core.retraining_orchestrator import RetrainingOrchestrator
from core.supabase_client import get_all_tickers, SupabaseClient
```
**Issue**: Imports inside route handlers cause slower response on first call. Should be at file top.

### 3. API Endpoint Mismatch in `apiService.js`
**File**: `frontend/src/services/apiService.js`
- `getHistoricalData()` hits `GET /historical/{ticker}` but routes.py expects `GET /historical/{ticker}` with query param `days` — looks correct
- `getMetrics()` hits `GET /metrics/{ticker}` but routes.py defines it — looks correct
- `getForecastByTicker()` hits `GET /forecast/{ticker}?days=N` — looks correct

### 4. No `requirements.txt` Update
`schedule`, `supabase`, `python-dotenv` packages are not listed in `requirements.txt` but are used in the code.

### 5. No Frontend Tests
Zero test files in `frontend/src/`. No Jest config, no React Testing Library setup.

### 6. Static Insights Page
Insights.jsx has hardcoded old blog posts with no connection to the ML engine — it's a template placeholder.

### 7. No Graceful Degradation for Supabase on Frontend
`Market.jsx` and `Reports.jsx` show full-page error states when Supabase is unavailable. Should show mock data instead.

---

## Action Items (Priority Order)

### 🔴 P0 — Critical (Fix Immediately)

| # | Action | Files | Effort |
|---|--------|-------|--------|
| 1 | Add `load_model_and_scaler()` method + scaler persistence | `model_manager.py`, `forecasting_service.py` | 2 hours |
| 2 | Fix `save_model()` to accept optional scaler parameter | `model_manager.py`, `retraining_orchestrator.py` | 1 hour |
| 3 | Fix `test_prediction.py` — change `get_forecast()` to `predict()` | `test_prediction.py` | 5 min |
| 4 | Fix `routes.py` — change `service.get_metrics()` to proper call | `routes.py` | 15 min |
| 5 | Fix `test_ai.py` — verify method name matches | `test_ai.py` | 5 min |

### 🟡 P1 — High Priority (This Week)

| # | Action | Files | Effort |
|---|--------|-------|--------|
| 6 | Update `requirements.txt` with missing packages (`schedule`, `supabase`, `python-dotenv`) | `requirements.txt` | 10 min |
| 7 | Update `core/__init__.py` to export all modules | `core/__init__.py` | 5 min |
| 8 | Update README.md with accurate structure, endpoints, and dependencies | `README.md` | 2 hours |
| 9 | Update DEVELOPMENT.md with Supabase setup, new endpoints, complete file tree | `DEVELOPMENT.md` | 1 hour |
| 10 | Move inline imports in routes.py to top of file | `routes.py` | 10 min |

### 🟢 P2 — Medium Priority (This Sprint)

| # | Action | Files | Effort |
|---|--------|-------|--------|
| 11 | Replace static signal data in Dashboard.jsx with dynamic API data | `Dashboard.jsx` | 4 hours |
| 12 | Replace hardcoded technical indicators in Analytics.jsx | `Analytics.jsx` | 4 hours |
| 13 | Either implement real Insights page or remove it | `Insights.jsx` | 2-8 hours |
| 14 | Add graceful fallback for Supabase-dependent pages (Market, Reports) | `Market.jsx`, `Reports.jsx` | 2 hours |
| 15 | Add scaler persistence to ModelManager (save/load pickle) | `model_manager.py` | 2 hours |

### 🔵 P3 — Low Priority (Backlog)

| # | Action | Effort |
|---|--------|--------|
| 16 | Convert .jsx files to TypeScript (.tsx) | 3-4 days |
| 17 | Set up frontend test suite (Jest + React Testing Library) | 1-2 days |
| 18 | Add backend tests (pytest) for forecasting service | 1 day |
| 19 | Set up CI/CD pipeline (GitHub Actions) | 1 day |
| 20 | Add Dockerfile and docker-compose for deployment | 1 day |
| 21 | Add API rate limiting and authentication | 2 days |
| 22 | Add Redis caching layer | 2 days |

---

## 📊 Summary Dashboard

```
┌─────────────────────────────────────────────────────┐
│                  CODEBASE HEALTH                      │
├─────────────────────────────────────────────────────┤
│  Backend Files: 13 (8 core, 1 api, 4 scripts)       │
│  Frontend Files: 10 (5 pages, 1 hooks, 1 service)   │
│  Documentation: 5 files                             │
│  Total Lines of Code: ~2,400                        │
├─────────────────────────────────────────────────────┤
│  Critical Bugs: 4                                    │
│  Code Smells: 7                                      │
│  Documentation Gaps: 2                               │
│  Static Data Pages: 3                                │
│  Missing Test Files: Yes                             │
├─────────────────────────────────────────────────────┤
│  Overall Status: 🟡 Needs Attention                  │
│  Priority Fixes: 5 items                             │
│  Estimated Fix Time: 3-4 hours                       │
│  Full Polish Sprint: 2-3 weeks                       │
└─────────────────────────────────────────────────────┘
```

---

## 🔗 Quick Links

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Revised system architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Setup guide (needs update)
- [db.md](./db.md) — Database schema
- [README.md](../README.md) — Project overview (needs update)

---

**Next Review**: May 24, 2026 (recommended weekly cadence)
**Audit Version**: 1.0