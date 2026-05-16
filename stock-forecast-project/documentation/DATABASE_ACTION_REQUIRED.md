# 🔧 Database Setup - Action Required

**Status**: ⚠️ Need Setup Before Testing

---

## 🚨 Critical: `.env` File Missing

Sebelum bisa test database, kamu HARUS membuat file `.env` di folder `backend/`:

### File Location
```
stock-forecast-project/
├── backend/
│   ├── .env           ← CREATE THIS FILE
│   ├── main.py
│   ├── requirements.txt
│   └── ...
```

### File Content
```env
# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=True

# Frontend Configuration
VITE_API_URL=http://localhost:8000/api/v1

# Model Configuration
MODEL_PATH=backend/saved_models/lstm_model.keras
WINDOW_SIZE=60

# Data Configuration
DATA_PERIOD=5y
TRAIN_TEST_SPLIT=0.8

# API Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=INFO

# ================================================
# Supabase Configuration (REQUIRED FOR DATABASE)
# ================================================
# Get these from: https://supabase.com → Settings → API

# Supabase Project URL
SUPABASE_URL=https://your-project.supabase.co

# Supabase Service Role Key (FULL ACCESS - for backend only)
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Langkah Setup

### Step 1: Setup Supabase Project (if belum punya)
1. Buka https://supabase.com
2. Sign up or login
3. Click "New Project"
4. Isi form:
   - **Project name**: `stock-forecast`
   - **Database password**: (isi dengan password kuat)
   - **Region**: (pilih terdekat)
5. Click "Create new project"
6. Tunggu 2-3 menit sampai selesai

### Step 2: Get Credentials
1. Di Supabase Dashboard, pergi ke **Settings → API**
2. Copy **Project URL** → Ini adalah `SUPABASE_URL`
3. Copy **Service Role Secret** → Ini adalah `SUPABASE_KEY`

⚠️ **PENTING**: Gunakan **Service Role Secret**, bukan Anonymous Key!

### Step 3: Create Backend `.env` File
1. Open folder `backend/` di VS Code
2. Create file baru: `backend/.env`
3. Copy template di atas
4. Replace `SUPABASE_URL` dan `SUPABASE_KEY` dengan credentials dari Step 2

**Example**:
```env
SUPABASE_URL=https://abcdefgh12345.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoMTIzNDUiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjI0MzAwMDAwLCJleHAiOjE5MzAwMDAwMDB9.xxxxxxxxxxxx
```

### Step 4: Execute Database Schema
1. Di Supabase Dashboard, pergi ke **SQL Editor**
2. Click "New Query"
3. Open file `backend/schema.sql` di VS Code
4. Copy ALL content
5. Paste ke Supabase SQL Editor
6. Click "Execute"
7. Tunggu sampai muncul `✓ Success`

### Step 5: Create Storage Bucket
1. Di Supabase Dashboard, pergi ke **Storage**
2. Click "Create new bucket"
3. **Bucket name**: `models`
4. **UNCHECK** "Private bucket" (harus public)
5. Click "Create bucket"

### Step 6: Verify Setup
```bash
# Terminal di backend folder
python main.py
```

Lihat logs, seharusnya muncul:
```
✅ Supabase client initialized successfully
✅ Database connection successful
```

---

## ✅ Testing Endpoints

### Test 1: Database Health
```bash
curl http://localhost:8000/api/v1/health/database
```

Response harus:
```json
{
  "database": "connected",
  "status": "healthy",
  "timestamp": "2026-05-16T..."
}
```

### Test 2: Market Summary
```bash
curl http://localhost:8000/api/v1/market/summary
```

Response harus:
```json
{
  "tickers": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "sector": "Technology",
      "price": 195.62,
      "change_percent": 1.23,
      ...
    }
  ],
  "total": 8,
  "timestamp": "2026-05-16T..."
}
```

### Test 3: Reports History
```bash
curl http://localhost:8000/api/v1/reports/history
```

Response (awalnya kosong):
```json
{
  "reports": [],
  "total": 0,
  "timestamp": "2026-05-16T..."
}
```

---

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"
**Penyebab**: `.env` file tidak ada atau tidak ada di folder yang benar

**Fix**:
- Check file ada di `backend/.env` (bukan di folder parent)
- Pastikan `SUPABASE_URL` dan `SUPABASE_KEY` ada di file

### Error: "Database connection failed"
**Penyebab**: Credentials salah atau database belum siap

**Fix**:
- Double-check credentials di `.env` vs Supabase dashboard
- Verify SQL schema sudah di-execute di Supabase
- Check Supabase project status di dashboard

### Endpoint returns empty tickers
**Penyebab**: Sample data belum di-insert atau schema belum executed

**Fix**:
- Re-run SQL schema di Supabase SQL Editor
- Schema seharusnya auto-insert 8 tickers

---

## 📋 Complete Checklist

- [ ] Supabase project created
- [ ] Got SUPABASE_URL & SUPABASE_KEY
- [ ] Created `backend/.env` file
- [ ] Updated `.env` dengan credentials
- [ ] Executed `backend/schema.sql` di Supabase
- [ ] Created `models` bucket di Supabase Storage
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Backend server started (`python main.py`)
- [ ] `/health/database` endpoint responds "connected"
- [ ] `/market/summary` endpoint returns tickers
- [ ] `/reports/history` endpoint responds
- [ ] Ready untuk test full flow

---

## 🎯 Status: Ready When `.env` Created

Setelah membuat `.env` file dan setup Supabase, database integration akan fully operational! ✅

**Estimated Time**: 15-20 minutes untuk setup

---

**Last Updated**: May 16, 2026  
**Documentation**: See SUPABASE_SETUP_GUIDE.md for detailed instructions
