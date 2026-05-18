# CLAUDE.md - Precision Analytics (Stock Forecast AI)

## Overview
Autonomous financial forecasting agent that automates the ML lifecycle (LSTM) for stock market analysis. The agent has high autonomy to perform refactoring and optimizations without explicit approval.

## Tech Stack
- **Backend**: Python 3.11, FastAPI, TensorFlow 2.14, Scikit-learn
- **Database & Storage**: Supabase (PostgreSQL & Cloud Storage)
- **Data Source**: yfinance (Yahoo Finance API)
- **Frontend**: React 18 (Vite), Tailwind CSS, TanStack Query, Recharts
- **Containerization**: Docker & Docker Compose

## Project Structure
- `backend/` - FastAPI (Logic, ML, API)
- `frontend/` - React (Dashboard UI)
- `docker-compose.yml` - Full-stack orchestration

## Commands
### Backend
- Run: `cd backend && python main.py`
- Initial Train: `python run_first_train.py`
- Check DB: `python check_db.py`
- Clear Cache: `pip cache purge`

### Frontend
- Run: `cd frontend && npm run dev`
- Build: `npm run build`

### Docker (Industrial Deployment)
- Build & Run All: `docker-compose up --build`
- Stop All: `docker-compose down`

## Architecture Rules
- **Agent Autonomy**: Agent diperbolehkan melakukan refactoring, perbaikan bug, dan optimasi kode secara OTOMATIS. Persetujuan user hanya diperlukan jika ingin menambah atau menghapus fitur besar (major features).
- **Error Handling Policy**: Jika `yfinance` mengalami gangguan (rate-limited/API down), JANGAN tampilkan data dummy (mock). Tampilkan pesan: "Market API is currently down or undergoing maintenance."
- **CORS Policy**: Berikan kebebasan akses penuh (`allow_origins=["*"]`) untuk memudahkan integrasi selama pengembangan.
- **Model Storage**: Model wajib di-upload ke Supabase Storage, local cache di `saved_models/` hanya untuk sementara.

## Code Conventions
- **Initiative**: Agent harus mengambil inisiatif untuk memperbaiki redundansi kode dan meningkatkan performa tanpa menunggu perintah.
- **Naming**: Python (snake_case), React (PascalCase components), API (JSON format).
- **Validation**: Wajib melakukan perbandingan RMSE (2% tolerance) saat retraining.

## Non-Obvious Commands
- Seed Tickers: `python seed_data.py` (Mengisi daftar 8 saham awal ke Supabase).
- Model Check: `curl http://localhost:8000/api/v1/models/status`

## Known Issues & Workarounds
- **yfinance Blocking**: Workaround: Return HTTP 503 (Service Unavailable) dengan pesan maintenance jika API diblokir.
- **TensorFlow AVX**: Abaikan warning instruksi CPU di terminal.

## Domain Terms
- **Ticker**: Simbol saham (AAPL, NVDA, BBCA.JK).
- **Inference**: Proses AI melakukan prediksi harga.
- **RMSE**: Metrik kesalahan (Akurasi model).