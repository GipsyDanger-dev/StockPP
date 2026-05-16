🤖 Agent Guide: Stock Forecast Project (Supabase Edition)
📋 Project Overview
Mengonversi sistem data statis menjadi sistem dinamis berbasis Supabase untuk menyimpan metadata saham, riwayat training, dan file model Deep Learning.
🛠️ Stack Update
Database: Supabase (PostgreSQL)
Storage: Supabase Storage (untuk file .keras dan .pkl)
Backend: FastAPI dengan supabase-py
Frontend: React dengan TanStack Query & Axios
1. Konfigurasi Database (Supabase SQL Editor)
Agent harus memastikan tabel-tabel berikut ada di PostgreSQL Supabase:
code
SQL
-- 1. Tabel Tickers (Daftar Saham)
CREATE TABLE tickers (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT,
    is_active BOOLEAN DEFAULT true,
    last_trained_at TIMESTAMP WITH TIME ZONE
);

-- 2. Tabel Training Logs (Untuk Halaman Reports)
CREATE TABLE training_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticker TEXT REFERENCES tickers(symbol),
    report_name TEXT,
    rmse FLOAT,
    mae FLOAT,
    status TEXT, -- 'Completed', 'Processing', 'Failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bucket Storage
-- Buat bucket bernama 'models' di Dashboard Supabase untuk simpan file .keras & .pkl
2. Instruksi Backend (FastAPI Integration)
A. Environment Variables
Simpan di .env:
code
Env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
B. Logic: Simpan Model ke Cloud (ModelManager Update)
Agent tidak lagi menyimpan ke folder saved_models/ lokal, melainkan upload ke Supabase Storage.
Update backend/core/model_manager.py:
code
Python
from supabase import create_client
import pickle

class SupabaseModelManager:
    def __init__(self):
        self.supabase = create_client(URL, KEY)

    def save_model_to_cloud(self, ticker, model_file, scaler_obj, metrics):
        # 1. Upload .keras ke Storage
        with open(model_file, "rb") as f:
            self.supabase.storage.from_("models").upload(f"{ticker}/model.keras", f)
        
        # 2. Upload Scaler
        scaler_bytes = pickle.dumps(scaler_obj)
        self.supabase.storage.from_("models").upload(f"{ticker}/scaler.pkl", scaler_bytes)

        # 3. Catat di Database
        self.supabase.table("training_logs").insert({
            "ticker": ticker,
            "rmse": metrics['rmse'],
            "status": "Completed",
            "report_name": f"AI Training {ticker}"
        }).execute()
3. Instruksi Frontend (React Dynamic Data)
A. Dashboard & Market Explorer
Agent harus mengubah useEffect atau useQuery untuk mengambil data dari endpoint FastAPI yang sudah terhubung ke Supabase.
Endpoint Baru yang Harus Dibuat:
GET /api/v1/market/summary: Mengambil daftar ticker dari tabel tickers dan harganya dari yfinance.
GET /api/v1/reports/history: Mengambil data dari tabel training_logs.
B. Sinkronisasi Navigasi
Halaman Market harus bisa mengirim user ke halaman Analytics secara dinamis:
code
JavaScript
// Di Market.jsx
const handleRowClick = (symbol) => {
  navigate(`/analytics/${symbol}`);
};
4. Alur Kerja Agent (Step-by-Step)
Langkah 1: Inisialisasi Database
Hubungkan ke Supabase.
Jalankan SQL schema untuk tabel tickers dan training_logs.
Masukkan data awal (Seed) ke tabel tickers (AAPL, MSFT, NVDA, TSLA, BBCA.JK).
Langkah 2: Update Backend Service
Instal pip install supabase.
Modifikasi RetrainingOrchestrator agar memanggil database setelah training selesai.
Buat router baru GET /market/summary yang menggabungkan data PostgreSQL dan Real-time Price dari yfinance.
Langkah 3: Re-wiring Frontend
Ganti data "dummy" di Dashboard.jsx, Market.jsx, dan Reports.jsx.
Gunakan useQuery dari TanStack Query untuk melakukan fetching ke endpoint baru.
Pastikan PriceChart menerima data dinamis dari historical dan forecast hasil API.
5. Definition of Done (Ceklis Akhir)

Dinamis: Harga di Market Explorer berubah sesuai data asli.

Persistence: Riwayat di halaman Reports muncul sesuai data di Supabase.

Cloud Storage: File model tidak lagi di lokal, tapi di Supabase Storage.

End-to-End: User mencari saham -> Klik View -> AI Prediksi jalan -> Data tersimpan di Cloud.