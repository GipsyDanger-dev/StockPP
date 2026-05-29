# Prediction Pipeline Audit

**Date:** 2026-05-29
**Auditor:** Claude (automated)
**Scope:** Full ML prediction pipeline — data fetching through forecast generation

---

## Executive Summary

The prediction pipeline has **6 critical bugs** that cause all forecasts to be systematically bearish. The root cause is a combination of data leakage during scaler fitting, stale features during multi-step prediction, and a model that has learned to output the distribution mean rather than meaningful price movements.

**Evidence from live test:**
```
NVDA: $214.25 -> $160.69 (7 identical days, clamped at -25% floor)
AAPL: $312.51 -> $249.19 (clamped at -20%)
MSFT: $426.99 -> $400.38 (-6.23%)
TSLA: $442.10 -> $371.01 (-16.08%)
```

Every single prediction is bearish. NVDA outputs the same value 7 times in a row. This is not a model accuracy issue — the pipeline itself is broken.

---

## Pipeline Flow (End-to-End)

```
User Request (POST /forecast)
    |
    v
[1] ForecastingService.predict()
    |
    v
[2] DataEngine.fetch_data()         -- yfinance OHLCV
    |
    v
[3] DataEngine._add_technical_indicators()  -- MA20, MA50, RSI, MACD
    |
    v
[4] Feature Scalers.transform()     -- StandardScaler per feature
    |
    v
[5] LSTM Multi-step Prediction      -- predict N days, feed back Close
    |
    v
[6] Close Scaler.inverse_transform() -- back to dollar prices
    |
    v
[7] Price Clamping (±25%)            -- safety bounds
    |
    v
[8] Trend Calculation                -- first forecast vs current
    |
    v
Response to User
```

---

## Bug #1: Data Leakage in Scaler Fitting [CRITICAL]

**File:** `data_engine.py:81-102` (prepare_data)
**File:** `retraining_orchestrator.py:96-104` (retrain_model)

**Problem:** `prepare_data()` fits StandardScaler on the ENTIRE dataset (train + test), then `create_sequences()` splits into X/y, and the orchestrator splits into train/test. The scaler has already "seen" the test data's distribution.

**Impact:** The scaler's mean and standard deviation are contaminated by future data. When the model predicts, the scaled values are shifted because the scaler's parameters include information from periods the model should never have seen.

**Code:**
```python
# data_engine.py:81-102
def prepare_data(self, df):
    df = self._add_technical_indicators(df)
    feature_data = df[self.feature_columns].values

    # BUG: Fits on ALL data before train/test split
    for i in range(NUM_FEATURES):
        col_scaled = self.feature_scalers[i].fit_transform(
            feature_data[:, i].reshape(-1, 1)
        )
    ...
```

```python
# retraining_orchestrator.py:96-107
df = self.data_engine.fetch_data(ticker_upper, period=period)
# Scalers fitted on ALL data here:
scaled_data, feature_scalers = self.data_engine.prepare_data(df)
X, y = self.data_engine.create_sequences(scaled_data)
# Then split — but scaler already contaminated:
split_idx = int(len(X) * 0.8)
X_train, X_test = X[:split_idx], X[split_idx:]
```

**Fix:** Split data into train/test FIRST, then fit scalers only on training data.

---

## Bug #2: Stale Features in Multi-Step Prediction [CRITICAL]

**File:** `forecasting_service.py:157-172`

**Problem:** When predicting day 2+, only the Close price is updated in the input sequence. Volume, MA20, MA50, RSI, and MACD remain frozen at their last known values from the historical data.

**Impact:** The model sees contradictory inputs — Close changes but all indicators stay the same. This creates out-of-distribution inputs that the model never saw during training. The model learned that when Close moves, indicators move too. When they don't, the model's predictions become unreliable.

**Code:**
```python
# forecasting_service.py:168-172
for step in range(days_ahead):
    next_pred = model.predict(current_sequence, verbose=0)
    pred_price_scaled = next_pred[0, 0]
    ...

    new_row = current_sequence[0, -1, :].copy()
    new_row[0] = pred_price_scaled  # Only Close is updated!
    # Volume, MA20, MA50, RSI, MACD are STALE

    new_val = new_row.reshape(1, 1, NUM_FEATURES)
    current_sequence = np.append(current_sequence[:, 1:, :], new_val, axis=1)
```

**Fix:** After each prediction, recalculate MA20, MA50, RSI, MACD using the predicted Close price. For Volume, use a rolling average or the last known value with a decay factor.

---

## Bug #3: Model Outputs Constant Values [CRITICAL]

**File:** `model.py` (architecture) + `forecasting_service.py` (prediction loop)

**Problem:** The NVDA model outputs $160.69 for all 7 days. This is a classic sign of a model that has learned to predict the training data's mean rather than meaningful patterns.

**Root Causes:**
1. StandardScaler centers data at 0 (mean). The model learns that predicting ~0 minimizes MSE loss.
2. When inverse-transformed, 0 maps to the scaler's mean price — which for a 5-year dataset is significantly below the current price.
3. The model has effectively learned: "predict the average historical price" rather than "predict the next day's price."

**Evidence:**
```
NVDA predictions: $160.69, $160.69, $160.69, $160.69, $160.69, $160.69, $160.69
NVDA current:     $214.25
Difference:       -25.0% (exactly at the clamp floor)
```

**Fix:** This is a consequence of Bug #1 (data leakage) and Bug #2 (stale features). Fixing those will also fix this. Additionally, consider using percentage returns as the target variable instead of raw prices.

---

## Bug #4: Trend Determined by First Day Only [HIGH]

**File:** `forecasting_service.py:190-192`

**Problem:** Trend is calculated by comparing only the first forecast point to the current price. If day 1 dips slightly but days 2-7 rally, the trend shows "Bearish."

**Code:**
```python
# Only uses first forecast point
first_forecast = future_prices[0]
trend = "Bullish" if first_forecast > current_price else "Bearish"
change_percent = ((first_forecast - current_price) / current_price * 100)
```

**Fix:** Use the average or last forecast price to determine trend:
```python
avg_forecast = np.mean(future_prices)
last_forecast = future_prices[-1]
trend = "Bullish" if last_forecast > current_price else "Bearish"
change_percent = ((last_forecast - current_price) / current_price * 100)
```

---

## Bug #5: Walk-Forward Validation Uses Contaminated Scalers [MEDIUM]

**File:** `retraining_orchestrator.py:104-116`

**Problem:** Walk-forward validation is supposed to be the gold standard for time series evaluation. But the scalers are fitted on ALL data before the walk-forward splits, so each fold's test set has already influenced the scaler parameters.

**Code:**
```python
# Orchestrator line 104: Scalers fitted on ALL data
scaled_data, feature_scalers = self.data_engine.prepare_data(df)
X, y = self.data_engine.create_sequences(scaled_data)

# Line 116: Walk-forward uses these contaminated scalers
wf_metrics = self._walk_forward_validate(X, y, n_splits=5, close_scaler=close_scaler)
```

**Fix:** Each walk-forward fold should fit its own scalers on the training portion only.

---

## Bug #6: Damping Applied to Scaled Values [LOW]

**File:** `forecasting_service.py:162-164`

**Problem:** The damping formula mixes scaled predictions with the mean of recent scaled predictions. With StandardScaler, the mean of recent predictions may not be meaningful because the scaled values are centered at 0.

**Code:**
```python
if step >= 3 and len(future_predictions) > 0:
    recent_mean = np.mean(future_predictions[-3:])
    pred_price_scaled = 0.7 * pred_price_scaled + 0.3 * recent_mean
```

**Impact:** Low — this code rarely triggers because most predictions are 7 days or fewer. But for longer horizons, it could amplify bias.

**Fix:** Apply damping in original price space (after inverse transform) or remove it entirely.

---

## Additional Issues

### Scaler Confusion in ModelManager
`load_model_and_scaler()` returns a single scaler (the close scaler), while `load_feature_scalers()` returns a list of 6 scalers. The naming is confusing — `saved_scaler` vs `feature_scalers` — and the code has backward-compatibility hacks that wrap a single scaler into a list of 6 identical copies. This is fragile.

### Cache Doesn't Invalidate on Model Retrain
The forecast cache uses a 1-hour TTL. If a model is retrained, stale cached predictions are served until the cache expires.

### Evaluation Metrics May Be Misleading
`evaluate_on_original_scale()` computes RMSE/MAE on the test set, but the test set data was used to fit the scaler (Bug #1), so these metrics are optimistic.

---

## Recommended Fix Priority

| # | Bug | Severity | Effort | Fix |
|---|-----|----------|--------|-----|
| 1 | Data leakage in scaler fitting | CRITICAL | Medium | Split data before fitting scalers |
| 2 | Stale features in multi-step prediction | CRITICAL | High | Recalculate indicators after each prediction |
| 3 | Model outputs constant values | CRITICAL | - | Consequence of #1 and #2 |
| 4 | Trend uses first day only | HIGH | Trivial | Use last or average forecast price |
| 5 | Walk-forward uses contaminated scalers | MEDIUM | Medium | Fit scalers per fold |
| 6 | Damping on scaled values | LOW | Trivial | Remove or apply in original space |

---

## Files Involved

| File | Lines | Issues |
|------|-------|--------|
| `backend/core/data_engine.py` | 147 | Bug #1 (scaler fitting) |
| `backend/core/forecasting_service.py` | 283 | Bug #2 (stale features), Bug #4 (trend), Bug #6 (damping) |
| `backend/core/retraining_orchestrator.py` | 255 | Bug #1 (orchestrator), Bug #5 (walk-forward) |
| `backend/core/model.py` | 216 | Bug #3 (model architecture — indirect) |
| `backend/core/model_manager.py` | 447 | Naming confusion, cache invalidation |
