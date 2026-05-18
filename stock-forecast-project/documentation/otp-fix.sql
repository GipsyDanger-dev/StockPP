-- ============================================
-- FIX: OTP Table
-- Problem: otp_verifications pakai user_id, tapi code pakai email
-- Solution: Ganti ke otp_codes sesuai code
-- ============================================

-- 1. Drop tabel lama yang salah
DROP TABLE IF EXISTS public.otp_verifications;

-- 2. Buat tabel yang benar (sesuai code)
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

-- 3. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON public.otp_codes(expires_at);

-- 4. RLS policy (backend pakai service role)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage OTPs" ON public.otp_codes
    FOR ALL USING (true) WITH CHECK (true);
