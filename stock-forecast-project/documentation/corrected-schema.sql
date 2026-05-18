-- ============================================
-- CORRECTED DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Tickers table (stock symbols)
CREATE TABLE IF NOT EXISTS public.tickers (
  symbol text NOT NULL,
  name text NOT NULL,
  sector text,
  country text DEFAULT 'US'::text,
  is_active boolean DEFAULT true,
  last_trained_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tickers_pkey PRIMARY KEY (symbol)
);

-- 2. Training logs (model training history)
CREATE TABLE IF NOT EXISTS public.training_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticker text NOT NULL,
  report_name text NOT NULL,
  rmse double precision NOT NULL,
  mae double precision NOT NULL,
  r_square double precision,
  accuracy double precision,
  training_samples integer,
  status text DEFAULT 'Completed'::text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT training_logs_pkey PRIMARY KEY (id),
  CONSTRAINT training_logs_ticker_fkey FOREIGN KEY (ticker) REFERENCES public.tickers(symbol)
);

-- 3. Model metadata (ML model info)
CREATE TABLE IF NOT EXISTS public.model_metadata (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticker text NOT NULL,
  model_version text,
  epochs integer,
  batch_size integer,
  sequence_length integer,
  model_path text,
  scaler_path text,
  training_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT model_metadata_pkey PRIMARY KEY (id),
  CONSTRAINT model_metadata_ticker_fkey FOREIGN KEY (ticker) REFERENCES public.tickers(symbol)
);

-- 4. Articles (blog/insight articles)
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'Market Analysis'::text,
  summary text,
  author text DEFAULT 'Admin'::text,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  image_url text,
  header_image text,
  thumbnail text,
  tags text[] DEFAULT '{}'::text[],
  read_time text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT articles_pkey PRIMARY KEY (id)
);

-- 5. OTP Codes (for password reset flow)
-- NOTE: This uses EMAIL, not user_id, because user is NOT logged in during reset
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  delivery_method text NOT NULL CHECK (delivery_method = ANY (ARRAY['email'::text, 'whatsapp'::text])),
  phone_number text,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_codes_pkey PRIMARY KEY (id)
);

-- Index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON public.otp_codes(expires_at);

-- ============================================
-- TABLES BELOW ARE NOT NEEDED (Supabase Auth handles these)
-- Kept for reference only - DO NOT CREATE
-- ============================================

-- ❌ users table - NOT NEEDED
-- Supabase Auth manages users in auth.users automatically
-- App uses supabase.auth.signUp() and supabase.auth.signIn()

-- ❌ auth_sessions table - NOT NEEDED
-- Supabase Auth manages sessions automatically
