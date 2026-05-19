-- Prediction History Table
-- Run this in Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS prediction_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    ticker text NOT NULL REFERENCES tickers(symbol),
    current_price double precision NOT NULL,
    predicted_prices jsonb NOT NULL,
    actual_prices jsonb,
    trend text,
    predicted_change_percent double precision,
    actual_change_percent double precision,
    direction_correct boolean,
    mean_absolute_error double precision,
    mean_percent_error double precision,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'expired')),
    days_ahead integer NOT NULL DEFAULT 7,
    created_at timestamptz DEFAULT now(),
    validated_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prediction_history_user_id ON prediction_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_history_ticker ON prediction_history(ticker);
CREATE INDEX IF NOT EXISTS idx_prediction_history_status ON prediction_history(status);
CREATE INDEX IF NOT EXISTS idx_prediction_history_created_at ON prediction_history(created_at DESC);

-- RLS (Row Level Security) - optional, enable if you want users to only see their own predictions
-- ALTER TABLE prediction_history ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own predictions" ON prediction_history FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own predictions" ON prediction_history FOR INSERT WITH CHECK (auth.uid() = user_id);
