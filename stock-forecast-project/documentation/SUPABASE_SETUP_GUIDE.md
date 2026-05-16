# 🚀 Supabase Integration Setup Guide

Stock Forecast Project telah diintegrasikan dengan **Supabase** untuk cloud database dan storage. Panduan ini akan memandu setup lengkapnya.

---

## 📋 Prerequisites

- Supabase account (gratis di https://supabase.com)
- Backend dependencies sudah diupdate dengan `supabase==2.0.3`
- Frontend dependencies sudah terpasang

---

## ⚙️ Step 1: Setup Supabase Project

### 1.1 Buat Supabase Project
1. Pergi ke https://supabase.com
2. Login / Sign up (gratis)
3. Click "New Project"
4. Isi nama project: `stock-forecast`
5. Setup password
6. Pilih region terdekat
7. Click "Create new project"
8. Tunggu 2-3 menit hingga selesai

### 1.2 Dapatkan Credentials
1. Pergi ke **Settings → API**
2. Copy **Project URL** → Simpan di `.env` sebagai `SUPABASE_URL`
3. Copy **Service Role Secret** → Simpan di `.env` sebagai `SUPABASE_KEY`

**⚠️ PENTING**: Gunakan Service Role Key untuk backend, bukan Anonymous Key!

---

## 💾 Step 2: Setup Database Schema

### 2.1 Run SQL Queries
1. Di Supabase Dashboard, buka **SQL Editor**
2. Click "New Query"
3. Copy seluruh isi file `backend/schema.sql`
4. Paste ke SQL Editor
5. Click "Execute"
6. Tunggu sampai berhasil (biasanya kurang dari 1 menit)

### 2.2 Verify Tabel
Run query ini untuk verify:
```sql
SELECT COUNT(*) as total_tickers FROM tickers;
SELECT COUNT(*) as total_logs FROM training_logs;
```

Seharusnya ada 8 tickers (AAPL, MSFT, NVDA, TSLA, GOOGL, BBCA.JK, PLTR, AMD)

---

## 📦 Step 3: Setup Storage Bucket

### 3.1 Buat Model Storage Bucket
1. Di Supabase Dashboard, pergi ke **Storage**
2. Click "Create new bucket"
3. Nama bucket: `models`
4. **UNCHECK** "Private bucket" (harus public untuk akses)
5. Click "Create bucket"

### 3.2 Configure CORS (Optional)
Jika diperlukan CORS dari frontend:
1. Click bucket `models`
2. Settings
3. CORS Policy biarkan default atau customize sesuai domain

---

## 🔧 Step 4: Update Environment Variables

### 4.1 Backend (.env)
Copy template dari `.env.example` dan update:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Ganti `your-project` dan paste credentials dari Step 1.2

### 4.2 Frontend (.env - optional)
Jika frontend perlu direct Supabase access:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=eyJ... (gunakan Anonymous Key, bukan Service Role)
```

---

## 📥 Step 5: Install & Test

### 5.1 Update Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 5.2 Restart Backend Server
```bash
# Jika backend sudah running, stop terlebih dahulu (Ctrl+C)
python main.py
```

Seharusnya muncul log:
```
✅ Supabase client initialized successfully
✅ Database connection successful
```

### 5.3 Test Endpoints

#### Market Summary (Supabase tickers + real prices)
```bash
curl http://localhost:8000/api/v1/market/summary
```

**Response:**
```json
{
  "tickers": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "sector": "Technology",
      "price": 195.62,
      "change_percent": 1.23,
      "is_active": true
    }
    // ... more tickers
  ],
  "total": 8,
  "timestamp": "2026-05-16T..."
}
```

#### Reports History
```bash
curl http://localhost:8000/api/v1/reports/history
```

**Response:**
```json
{
  "reports": [
    {
      "id": "uuid",
      "ticker": "AAPL",
      "report_name": "AI Training AAPL - 2026-05-16 10:30",
      "rmse": 5.234,
      "mae": 3.421,
      "status": "Completed",
      "created_at": "2026-05-16T..."
    }
  ],
  "total": 0,
  "timestamp": "2026-05-16T..."
}
```

#### Database Health
```bash
curl http://localhost:8000/api/v1/health/database
```

---

## 🎨 Step 6: Update Frontend Usage

Frontend sudah diupdate dengan new hooks dan API calls. Contoh:

### Dalam Component:
```jsx
import { useMarketSummary, useReportsHistory } from '../hooks/useApi';

function MyComponent() {
  // Fetch market data dari Supabase
  const { data: marketData, isLoading } = useMarketSummary();
  
  // Fetch training reports
  const { data: reportsData } = useReportsHistory();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {marketData?.tickers.map(ticker => (
        <div key={ticker.ticker}>{ticker.name}: ${ticker.price}</div>
      ))}
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Credentials saved di .env
- [ ] SQL schema executed
- [ ] Models bucket created
- [ ] Backend dependencies updated
- [ ] Backend server restarted
- [ ] `/market/summary` endpoint responds
- [ ] `/reports/history` endpoint responds
- [ ] `/health/database` shows healthy
- [ ] Frontend builds tanpa error
- [ ] Market Explorer menampilkan tickers dari database
- [ ] Reports page menampilkan training history

---

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"
**Solusi**: Pastikan `.env` memiliki `SUPABASE_URL` dan `SUPABASE_KEY`

### Error: "Database connection failed"
**Solusi**: 
- Verify credentials di `.env`
- Check Supabase project status
- Ensure SQL schema sudah di-execute

### Market data kosong
**Solusi**: 
- Ensure tickers tabel punya data
- Check yfinance dapat akses ke internet

### Storage upload failed
**Solusi**:
- Ensure bucket "models" sudah dibuat
- Verify bucket is public (not private)
- Check CORS policy

---

## 📚 File Structure

```
backend/
├── core/
│   ├── supabase_client.py     ← NEW: Supabase configuration
│   ├── model_manager.py       ← UPDATED: Cloud storage integration
│   └── ...
├── api/
│   └── routes.py              ← UPDATED: New endpoints (/market/summary, /reports/history)
├── schema.sql                 ← NEW: Database schema
├── requirements.txt           ← UPDATED: Added supabase, python-dotenv
└── ...

frontend/
├── src/
│   ├── services/
│   │   └── apiService.js      ← UPDATED: New API methods
│   ├── hooks/
│   │   └── useApi.js          ← UPDATED: New hooks
│   └── ...
```

---

## 🔄 Auto Training Report Logging

Ketika model di-train via `/retrain/{ticker}` endpoint, system otomatis:
1. Save model ke Supabase Storage (`models/{ticker}/model.keras`)
2. Log training metrics ke database (`training_logs` table)
3. Update `tickers.last_trained_at` timestamp

Ini semua di-handle di `ModelManager._upload_to_supabase()`

---

## 🎯 Next Steps

1. **Monitor Models**: Check Reports page untuk training history
2. **Seed More Data**: Tambah tickers ke `tickers` table jika perlu
3. **Setup Alerts**: Configure Supabase webhooks untuk training alerts
4. **Backup Data**: Setup Supabase backup policy

---

## 📞 Support

Jika ada error, check:
1. Browser console (Frontend errors)
2. Backend logs (Backend errors)
3. Supabase Dashboard (Database/Storage issues)
4. `.env` file (Credentials)

---

**Setup Selesai! 🎉**

Aplikasi sekarang fully integrated dengan Supabase untuk:
- ✅ Cloud database (tickers & training logs)
- ✅ Cloud storage (model files)
- ✅ Dynamic market data
- ✅ Training history tracking
