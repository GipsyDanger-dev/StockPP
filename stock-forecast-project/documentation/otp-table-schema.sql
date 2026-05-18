-- OTP (One-Time Password) table for password reset verification
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'whatsapp')),
    phone_number TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);

-- Auto-delete expired OTPs (optional, Supabase doesn't have scheduled jobs natively)
-- You can set up a cron job in Supabase Edge Functions or manually clean up

-- RLS policies
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage OTPs (backend uses service role key)
CREATE POLICY "Service role can manage OTPs" ON otp_codes
    FOR ALL
    USING (true)
    WITH CHECK (true);
