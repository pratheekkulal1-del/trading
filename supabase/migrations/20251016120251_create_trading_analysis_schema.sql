-- Trading Analysis Desktop App - Database Schema
-- 
-- Overview: AI-powered trading signal analysis system for TradingView charts
-- 
-- Tables:
-- 1. training_materials - Uploaded training documents (PDFs, videos, images, docs)
-- 2. trading_rules - AI-learned trading rules extracted from training materials
-- 3. chart_captures - TradingView screenshots for analysis
-- 4. market_structures - Detected market structures (CHOCH, BOS, order blocks, etc)
-- 5. trading_signals - Buy/sell signals with multi-timeframe analysis
-- 6. user_settings - User preferences and configuration

-- Table 1: Training Materials
CREATE TABLE IF NOT EXISTS training_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  extracted_content text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training materials"
  ON training_materials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training materials"
  ON training_materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training materials"
  ON training_materials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training materials"
  ON training_materials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table 2: Trading Rules
CREATE TABLE IF NOT EXISTS trading_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_name text NOT NULL,
  rule_description text NOT NULL,
  rule_type text NOT NULL,
  timeframe text NOT NULL,
  confidence_threshold numeric DEFAULT 0.75,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trading_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trading rules"
  ON trading_rules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading rules"
  ON trading_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading rules"
  ON trading_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trading rules"
  ON trading_rules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table 3: Chart Captures
CREATE TABLE IF NOT EXISTS chart_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  capture_url text NOT NULL,
  timeframe_4h_url text,
  timeframe_15m_url text,
  timeframe_1m_3m_url text,
  capture_timestamp timestamptz NOT NULL,
  analysis_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chart_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chart captures"
  ON chart_captures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chart captures"
  ON chart_captures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chart captures"
  ON chart_captures FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chart captures"
  ON chart_captures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table 4: Market Structures
CREATE TABLE IF NOT EXISTS market_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_capture_id uuid REFERENCES chart_captures(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  timeframe text NOT NULL,
  structure_type text NOT NULL,
  direction text NOT NULL,
  price_level numeric NOT NULL,
  confidence numeric NOT NULL,
  coordinates jsonb NOT NULL,
  detected_at timestamptz DEFAULT now()
);

ALTER TABLE market_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own market structures"
  ON market_structures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own market structures"
  ON market_structures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own market structures"
  ON market_structures FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own market structures"
  ON market_structures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table 5: Trading Signals
CREATE TABLE IF NOT EXISTS trading_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  chart_capture_id uuid REFERENCES chart_captures(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  entry_price numeric NOT NULL,
  stop_loss numeric NOT NULL,
  take_profit numeric NOT NULL,
  risk_reward_ratio numeric NOT NULL,
  position_size numeric,
  confidence_score numeric NOT NULL,
  timeframe_4h_structure text,
  timeframe_15m_action text,
  timeframe_3m_orderblock text,
  timeframe_1m_entry text,
  status text DEFAULT 'pending',
  alert_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  triggered_at timestamptz,
  expired_at timestamptz
);

ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trading signals"
  ON trading_signals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trading signals"
  ON trading_signals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading signals"
  ON trading_signals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trading signals"
  ON trading_signals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table 6: User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  capture_interval_seconds integer DEFAULT 60,
  min_confidence_threshold numeric DEFAULT 0.75,
  alert_sound_enabled boolean DEFAULT true,
  alert_toast_enabled boolean DEFAULT true,
  risk_reward_ratio numeric DEFAULT 5.0,
  openai_api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_materials_user_id ON training_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_rules_user_id ON trading_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_captures_user_id ON chart_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_chart_captures_timestamp ON chart_captures(capture_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_market_structures_user_id ON market_structures(user_id);
CREATE INDEX IF NOT EXISTS idx_market_structures_capture_id ON market_structures(chart_capture_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_user_id ON trading_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);