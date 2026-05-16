-- =====================================================
-- Supabase SQL Schema untuk Stock Forecast Project
-- Jalankan queries ini di Supabase SQL Editor
-- =====================================================

-- 1. Enable UUID extension (biasanya sudah enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabel Tickers (Daftar Saham)
CREATE TABLE IF NOT EXISTS tickers (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT,
    country TEXT DEFAULT 'US',
    is_active BOOLEAN DEFAULT true,
    last_trained_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Training Logs (Untuk Halaman Reports)
CREATE TABLE IF NOT EXISTS training_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticker TEXT NOT NULL REFERENCES tickers(symbol) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    rmse FLOAT NOT NULL,
    mae FLOAT NOT NULL,
    r_square FLOAT,
    accuracy FLOAT,
    training_samples INTEGER,
    status TEXT DEFAULT 'Completed', -- 'Completed', 'Processing', 'Failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Model Metadata (Optional)
CREATE TABLE IF NOT EXISTS model_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticker TEXT NOT NULL REFERENCES tickers(symbol) ON DELETE CASCADE,
    model_version TEXT,
    epochs INTEGER,
    batch_size INTEGER,
    sequence_length INTEGER,
    model_path TEXT,
    scaler_path TEXT,
    training_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert Sample Tickers
INSERT INTO tickers (symbol, name, sector, country) VALUES
    ('AAPL', 'Apple Inc.', 'Technology', 'US'),
    ('MSFT', 'Microsoft Corporation', 'Technology', 'US'),
    ('NVDA', 'NVIDIA Corporation', 'Technology', 'US'),
    ('TSLA', 'Tesla Inc.', 'Automotive', 'US'),
    ('GOOGL', 'Alphabet Inc.', 'Technology', 'US'),
    ('BBCA.JK', 'Bank Central Asia', 'Finance', 'ID'),
    ('PLTR', 'Palantir Technologies', 'Technology', 'US'),
    ('AMD', 'Advanced Micro Devices', 'Technology', 'US')
ON CONFLICT (symbol) DO NOTHING;

-- 6. Create Indexes untuk Performance
CREATE INDEX idx_training_logs_ticker ON training_logs(ticker);
CREATE INDEX idx_training_logs_created_at ON training_logs(created_at DESC);
CREATE INDEX idx_training_logs_status ON training_logs(status);
CREATE INDEX idx_model_metadata_ticker ON model_metadata(ticker);

-- 7. Create RLS Policies (Row Level Security - Optional)
ALTER TABLE tickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow read tickers" ON tickers FOR SELECT USING (true);
CREATE POLICY "Allow read training_logs" ON training_logs FOR SELECT USING (true);

-- =====================================================
-- Storage Setup
-- =====================================================
-- Buat bucket 'models' di Storage:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create new bucket named 'models'
-- 3. Make it public (unchecked "Private bucket")
-- 4. Set up CORS policy if needed
-- 5. Files akan disimpan dengan path: /models/{ticker}/model.keras
--                                     /models/{ticker}/scaler.pkl

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check tickers
SELECT COUNT(*) as total_tickers FROM tickers;

-- Check training logs
SELECT * FROM training_logs ORDER BY created_at DESC LIMIT 5;

-- Check model metadata
SELECT * FROM model_metadata ORDER BY training_date DESC LIMIT 5;
