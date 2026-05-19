# CLAUDE.md - StockPP (Stock Forecast AI)

## Overview
Project name: **StockPP**. "Precision Analytics" hanya brand name yang tampil di UI (logo, footer, sidebar), BUKAN nama project. Gunakan "StockPP" di commit message, dokumentasi, dan referensi project.

Autonomous financial forecasting agent that automates the ML lifecycle (LSTM) for stock market analysis. The agent has high autonomy to perform refactoring and optimizations without explicit approval.

## Tech Stack
- **Backend**: Python 3.11, FastAPI, TensorFlow 2.14, Scikit-learn
- **Database & Storage**: Supabase (PostgreSQL & Cloud Storage)
- **Data Source**: yfinance (Yahoo Finance API), Finnhub (real-time quotes)
- **Frontend**: React 18 (Vite), Tailwind CSS, TanStack Query v5, Recharts
- **Email**: Resend API (OTP delivery)
- **Auth**: Supabase Auth (signUp, signIn, signOut) + custom OTP flow (password reset)

## Project Structure
- `backend/` - FastAPI (Logic, ML, API)
- `frontend/` - React (Dashboard UI)
- `documentation/` - Project docs and SQL schemas

## Commands
### Backend
- Run: `cd backend && python main.py`
- Initial Train: `python run_first_train.py`
- Check DB: `python check_db.py`
- Clear Cache: `pip cache purge`
- Install deps: `pip install -r requirements.txt`

### Frontend
- Run: `cd frontend && npm run dev`
- Build: `npm run build`

## Database Tables
Run SQL in Supabase SQL Editor to create tables:
- `tickers` - Stock symbols (PK: symbol)
- `training_logs` - Model training history (FK: ticker)
- `articles` - Blog/insight articles (managed via Admin UI)
- `otp_codes` - OTP for password reset flow (email-based, NOT user_id-based)

Schema files: `documentation/otp-fix.sql`, `documentation/corrected-schema.sql`

## Architecture Rules
- **Agent Autonomy**: Agent diperbolehkan melakukan refactoring, perbaikan bug, dan optimasi kode secara OTOMATIS. Persetujuan user hanya diperlukan jika ingin menambah atau menghapus fitur besar (major features).
- **Commit & Push Policy**: Jika perubahan mencakup 3+ file atau merupakan major change, WAJIB commit dan push ke GitHub sebelum melanjutkan ke task berikutnya. Jangan menumpuk terlalu banyak perubahan dalam satu commit.
- **Error Handling Policy**: Jika `yfinance` mengalami gangguan (rate-limited/API down), JANGAN tampilkan data dummy (mock). Tampilkan pesan: "Market API is currently down or undergoing maintenance."
- **CORS Policy**: `allow_origins=["http://localhost:5173", "http://localhost:3000"]` (update di main.py jika perlu).
- **Model Storage**: Model wajib di-upload ke Supabase Storage, local cache di `saved_models/` hanya untuk sementara.

## OTP Password Reset Flow
1. User enters email on `/forgot-password` -> frontend calls `POST /auth/send-otp`
2. Backend generates 6-digit code, stores in `otp_codes` table, sends via Resend email
3. User enters code on `/verify-code` -> frontend calls `POST /auth/verify-otp`
4. Backend validates code + expiry, marks as used
5. Frontend sets `sessionStorage(otpVerified=true)`, redirects to `/new-password`
6. User sets new password -> calls `supabase.auth.updateUser()`

## Code Conventions
- **Initiative**: Agent harus mengambil inisiatif untuk memperbaiki redundansi kode dan meningkatkan performa tanpa menunggu perintah.
- **Naming**: Python (snake_case), React (PascalCase components), API (JSON format).
- **Validation**: Wajib melakukan perbandingan RMSE (2% tolerance) saat retraining.
- **No Unnecessary Comments**: JANGAN tambahkan komentar yang menjelaskan apa yang kode lakukan (sudah jelas dari kode). Komentar hanya untuk menjelaskan WHY (alasan, constraint, workaround), bukan WHAT. Hindari: docstrings yang mengulang nama fungsi, section dividers (`# ==== Section ====`), komentar inline yang menjelaskan baris berikutnya, emoji di log messages.

## Non-Obvious Commands
- Seed Tickers: Run INSERT statements from `backend/schema.sql` lines 52-61 in Supabase SQL Editor.
- Model Check: `curl http://localhost:8000/api/v1/models/status`

## Known Issues & Workarounds
- **yfinance Blocking**: Workaround: Return HTTP 503 (Service Unavailable) dengan pesan maintenance jika API diblokir.
- **TensorFlow AVX**: Abaikan warning instruksi CPU di terminal.

## Domain Terms
- **Ticker**: Simbol saham (AAPL, NVDA, BBCA.JK).
- **Inference**: Proses AI melakukan prediksi harga.
- **RMSE**: Metrik kesalahan (Akurasi model).