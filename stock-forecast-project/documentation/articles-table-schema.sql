-- Create articles table for Precision Analytics
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Market Analysis',
    summary TEXT,
    author TEXT DEFAULT 'Admin',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    image_url TEXT,
    header_image TEXT,
    thumbnail TEXT,
    tags TEXT[] DEFAULT '{}',
    read_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists, add new columns
ALTER TABLE articles ADD COLUMN IF NOT EXISTS header_image TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published articles
CREATE POLICY "Allow public read published articles" ON articles
    FOR SELECT
    USING (status = 'published');

-- Allow all operations for service role (admin)
CREATE POLICY "Allow all operations for service role" ON articles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample article (optional)
INSERT INTO articles (title, content, category, summary, author, status, tags, read_time)
VALUES (
    'Welcome to Precision Analytics',
    'Precision Analytics is an autonomous financial forecasting agent that automates the ML lifecycle for stock market analysis. Our LSTM-based models provide accurate price predictions with continuous retraining and validation.

Key Features:
- LSTM Neural Networks with 6 technical indicators
- Walk-forward validation for robust model evaluation
- Automatic retraining when models become stale
- Real-time market data from yfinance and Finnhub

Get started by training your first model on the Dashboard.',
    'System Report',
    'Introduction to our AI-powered stock forecasting platform.',
    'Admin',
    'published',
    ARRAY['introduction', 'getting-started', 'platform'],
    '3 min read'
);
