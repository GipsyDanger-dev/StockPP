# Full Codebase Audit - 2026-05-19

Comprehensive audit of backend, frontend, database schema, and documentation.

---

## CRITICAL - Will Cause Runtime Failures

### 1. Missing `email-validator` in requirements.txt
- **File**: `backend/requirements.txt`
- **Impact**: Server will not start. `routes.py:7` imports `EmailStr` from pydantic, which requires `email-validator` as a separate package.
- **Fix**: Add `email-validator>=2.0.0` to requirements.txt, then `pip install email-validator`.

### 2. Wrong key name in retraining_orchestrator.py
- **File**: `backend/core/retraining_orchestrator.py:263`
- **Code**: `return [t["ticker"] for t in tickers_data]`
- **Impact**: `KeyError` at runtime. The `tickers` table uses `symbol` as column name, not `ticker`.
- **Fix**: Change to `t["symbol"]`.

### 3. NewPassword.jsx - Password reset will fail
- **File**: `frontend/src/pages/NewPassword.jsx:67`
- **Code**: `supabase.auth.updateUser({ password: form.password })`
- **Impact**: This requires an active Supabase auth session, but the OTP flow only sets `sessionStorage` flags - it does NOT create a Supabase session. `updateUser()` will fail with "session expired" error.
- **Fix**: Need a backend endpoint like `POST /auth/reset-password` that accepts email + new_password, verifies the OTP was completed (check sessionStorage on frontend, or add a backend token mechanism), and uses Supabase Admin API to update the password.

---

## HIGH - Produces Incorrect Results

### 4. Scaler mismatch in forecasting_service.py (fit_transform vs transform)
- **File**: `backend/core/forecasting_service.py:116`
- **Code**: `scaled_features = self.data_engine.feature_scaler.fit_transform(feature_data)`
- **Impact**: `fit_transform` overwrites the scaler loaded from the saved model. Prediction data is scaled differently than training data, producing wrong predictions.
- **Fix**: Use `transform` instead of `fit_transform`.

### 5. Price inverse-transform uses wrong scaler
- **File**: `backend/core/forecasting_service.py:156-158`
- **Code**: `future_prices = saved_scaler.inverse_transform(np.array(future_predictions).reshape(-1, 1)).flatten()`
- **Impact**: `saved_scaler` is the price scaler (fitted on Close prices only), but model output is in multi-feature scaler space. Inverse transform gives wrong price values.
- **Fix**: Need to use the correct scaler that matches how the model was trained, or extract only the price component before inverse transforming.

---

## MEDIUM - Code Quality / Maintenance

### 6. load_dotenv() not called in main.py
- **File**: `backend/main.py`
- **Impact**: Environment variables are only loaded in `supabase_client.py`. If import order changes or `main.py` is used standalone, env vars like `FINNHUB_API_KEY` and `RESEND_API_KEY` may not be available.
- **Fix**: Add `from dotenv import load_dotenv; load_dotenv()` at the top of main.py.

### 7. React Query deprecated options
- **File**: `frontend/src/hooks/useApi.js:13,85`
- **Issues**:
  - Line 13: `cacheTime` should be `gcTime` (renamed in v5)
  - Line 85: `keepPreviousData: true` should be `placeholderData: keepPreviousData`
- **Impact**: Console deprecation warnings. Will break in future React Query versions.

### 8. Inconsistent API access pattern
- **Files**: Analytics.jsx, Market.jsx, ForgotPassword.jsx, VerifyCode.jsx
- **Issue**: Direct `axios.get()` and `fetch()` calls bypass the centralized `apiService.js` layer. Existing hooks (`useTickerSearch`, `useQuote`) are defined but not used.
- **Fix**: Use apiService functions or existing hooks instead of direct HTTP calls.

### 9. No 404 page
- **File**: `frontend/src/App.jsx`
- **Impact**: Invalid URLs show a blank page with just the sidebar (inner Routes match nothing).
- **Fix**: Add a catch-all route inside the Layout routes that renders a "Not Found" component.

### 10. CORS mismatch with documentation
- **File**: `backend/main.py:20-21`
- **Issue**: Code restricts to `["http://localhost:5173", "http://localhost:3000"]` but CLAUDE.md says `allow_origins=["*"]`.
- **Fix**: Either update code to match docs (use `*` for dev) or update docs to match code.

### 11. Auth operations outside AuthContext
- **Files**: ForgotPassword.jsx, VerifyCode.jsx, NewPassword.jsx
- **Issue**: These pages use raw `fetch()` and direct Supabase calls instead of flowing through AuthContext. Architecturally inconsistent with the rest of the auth system.
- **Fix**: Add `sendOtp`, `verifyOtp`, `resetPassword` methods to AuthContext.

---

## LOW - Cleanup

### 12. Dead frontend component files (never imported)
- `frontend/src/components/Header.jsx`
- `frontend/src/components/Footer.jsx`
- `frontend/src/components/Common.jsx`
- `frontend/src/components/index.js`
- **Fix**: Delete these files.

### 13. Dead hooks in useApi.js (7 of 15 never used)
- `useValidateTicker`, `useHistoricalData`, `useMetrics`, `useDatabaseHealth`, `useTickerSearch`, `useQuote`, `useArticle`
- **Fix**: Remove unused hooks.

### 14. Dead service function
- `frontend/src/services/apiService.js` - `getForecastByTicker` is never called.
- **Fix**: Remove it.

### 15. Dead npm dependency
- `date-fns` in package.json is never imported.
- **Fix**: Remove with `npm uninstall date-fns`.

### 16. Unused imports in Analytics.jsx
- **File**: `frontend/src/pages/Analytics.jsx:3`
- `PieChart`, `LayoutDashboard`, `Lightbulb`, `FileText`, `BarChart3` imported but never used.
- **Fix**: Remove from import statement.

### 17. Redundant training scripts
- `backend/train_aapl.py` and `backend/run_first_train.py` are functionally identical.
- **Fix**: Delete `train_aapl.py`.

### 18. Unused .env variables in backend
- `BACKEND_HOST`, `BACKEND_PORT`, `DEBUG`, `TRAIN_TEST_SPLIT`, `CORS_ORIGINS`, `MODEL_PATH`, `VITE_API_URL` - all defined but never read by code.
- **Fix**: Remove unused vars from .env.

### 19. Debug comment in main.py
- **File**: `backend/main.py:27`
- Indonesian debug comment `# BARIS YANG HILANG (WAJIB ADA)` left in production code.
- **Fix**: Remove or replace with English comment.

### 20. Dead variable in routes.py
- **File**: `backend/api/routes.py:247`
- `request = PredictionRequest(...)` created but never used.
- **Fix**: Remove the unused variable.

### 21. Wrong error key in test_prediction.py
- **File**: `backend/test_prediction.py:10`
- Checks `"error" in result` but predict() returns `"status": "error"`.
- **Fix**: Change to `result.get("status") == "error"`.

### 22. model_metadata table never used
- Defined in `backend/schema.sql` but no Python code reads/writes to it.
- **Fix**: Either implement model metadata tracking or remove the table.

### 23. Unused training_logs columns
- `r_square`, `accuracy`, `training_samples`, `error_message` are defined but never populated by `insert_training_log()`.
- **Fix**: Either populate them or remove from schema.

---

## SECURITY

### 24. API keys committed to repository
- **File**: `backend/.env`
- Contains live Supabase service_role key, Finnhub API key, Resend API key.
- **Impact**: Full database access exposed if repo is public.
- **Fix**:
  1. Rotate all keys immediately.
  2. Use `.env.example` with placeholder values.
  3. Ensure `.env` is in `.gitignore` (it is, but files were committed before gitignore was added).

---

## DOCUMENTATION ISSUES (CLAUDE.md)

### 25. References non-existent files
- `seed_data.py` - documented but does not exist. Seed SQL is in `schema.sql`.
- `docker-compose.yml` - documented but does not exist.
- Docker section in Commands - no Docker files exist.

### 26. CORS policy mismatch
- CLAUDE.md says `allow_origins=["*"]` but code restricts to localhost.

### 27. Missing documentation for new features
- OTP system (send-verify-reset flow) not documented.
- Articles/Insights system not documented.
- Resend API integration not documented.

---

## Action Priority

| Priority | Action | Effort |
|----------|--------|--------|
| 1 | Fix `email-validator` missing (CRITICAL #1) | 1 min |
| 2 | Fix `t["ticker"]` -> `t["symbol"]` (CRITICAL #2) | 1 min |
| 3 | Fix scaler bugs in forecasting_service.py (HIGH #4,#5) | 30 min |
| 4 | Fix NewPassword session issue (CRITICAL #3) | 1 hour |
| 5 | Add `load_dotenv()` to main.py (MEDIUM #6) | 1 min |
| 6 | Fix React Query deprecations (MEDIUM #7) | 5 min |
| 7 | Update CLAUDE.md (DOCS #25-27) | 10 min |
| 8 | Clean up dead code (LOW #12-23) | 30 min |
| 9 | Rotate exposed API keys (SECURITY #24) | 15 min |
