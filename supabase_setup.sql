-- ============================================
-- VIRTUAL CARD SYSTEM - SUPABASE SQL SETUP
-- Copy & paste into Supabase SQL Editor
-- ============================================

-- ============================================
-- TABLE 1: VIRTUAL CARDS
-- ============================================
CREATE TABLE virtual_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Card Details
  name TEXT NOT NULL,
  card_number_encrypted TEXT NOT NULL,
  card_expiry TEXT NOT NULL,
  card_cvv_encrypted TEXT NOT NULL,
  
  -- Financial
  initial_amount DECIMAL(10, 2) NOT NULL,
  current_balance DECIMAL(10, 2) NOT NULL,
  spend_limit DECIMAL(10, 2),
  amount_spent DECIMAL(10, 2) DEFAULT 0,
  
  -- Type & Duration
  card_type TEXT NOT NULL CHECK (card_type IN ('limited', 'single-use', 'permanent')),
  duration_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  -- Status & Security
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired')),
  is_locked BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMP,
  transaction_count INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_virtual_cards_user_id ON virtual_cards(user_id);
CREATE INDEX idx_virtual_cards_status ON virtual_cards(status);
CREATE INDEX idx_virtual_cards_expires_at ON virtual_cards(expires_at);

-- Row Level Security
ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards"
  ON virtual_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON virtual_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON virtual_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON virtual_cards FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE 2: VIRTUAL CARD TRANSACTIONS
-- ============================================
CREATE TABLE virtual_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES virtual_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction Details
  merchant_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'HTG',
  transaction_type TEXT DEFAULT 'charge' CHECK (transaction_type IN ('charge', 'refund')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  status_reason TEXT,
  
  -- Security
  otp_verified BOOLEAN DEFAULT FALSE,
  otp_attempts INTEGER DEFAULT 0,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  external_ref TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_vctr_card_id ON virtual_card_transactions(card_id);
CREATE INDEX idx_vctr_user_id ON virtual_card_transactions(user_id);
CREATE INDEX idx_vctr_created_at ON virtual_card_transactions(created_at DESC);
CREATE INDEX idx_vctr_status ON virtual_card_transactions(status);

-- Row Level Security
ALTER TABLE virtual_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON virtual_card_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE 3: VIRTUAL CARD SECURITY LOGS
-- ============================================
CREATE TABLE virtual_card_security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES virtual_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Log Details
  event_type TEXT NOT NULL,
  event_description TEXT,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vcsl_card_id ON virtual_card_security_logs(card_id);
CREATE INDEX idx_vcsl_user_id ON virtual_card_security_logs(user_id);
CREATE INDEX idx_vcsl_severity ON virtual_card_security_logs(severity);

-- Row Level Security
ALTER TABLE virtual_card_security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security logs"
  ON virtual_card_security_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE 4: OTP CODES (For verification)
-- ============================================
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES virtual_card_transactions(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_otp_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_expires_at ON otp_codes(expires_at);

-- Row Level Security
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own OTPs"
  ON otp_codes FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE 5: CARD LIMITS & RULES
-- ============================================
CREATE TABLE card_limit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Limits per user
  max_cards_active INTEGER DEFAULT 10,
  max_card_value DECIMAL(10, 2) DEFAULT 1000,
  max_daily_spend DECIMAL(10, 2) DEFAULT 5000,
  max_transactions_per_hour INTEGER DEFAULT 10,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to auto-expire cards
CREATE OR REPLACE FUNCTION expire_virtual_cards()
RETURNS void AS $$
BEGIN
  UPDATE virtual_cards
  SET status = 'expired'
  WHERE status = 'active' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check card balance before transaction
CREATE OR REPLACE FUNCTION check_card_balance(
  card_id UUID,
  transaction_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  available_balance DECIMAL;
BEGIN
  SELECT (current_balance - amount_spent) INTO available_balance
  FROM virtual_cards
  WHERE id = card_id;
  
  RETURN available_balance >= transaction_amount;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER virtual_cards_updated_at
  BEFORE UPDATE ON virtual_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- ============================================
-- VIEW: User Card Summary
-- ============================================
CREATE VIEW user_card_summary AS
SELECT 
  u.id as user_id,
  COUNT(vc.id) as total_cards,
  COUNT(CASE WHEN vc.status = 'active' THEN 1 END) as active_cards,
  SUM(CASE WHEN vc.status = 'active' THEN vc.current_balance ELSE 0 END) as total_balance,
  SUM(CASE WHEN vc.status = 'active' THEN vc.amount_spent ELSE 0 END) as total_spent,
  MAX(vc.created_at) as last_card_created
FROM auth.users u
LEFT JOIN virtual_cards vc ON u.id = vc.user_id
GROUP BY u.id;

-- ============================================
-- SAMPLE DATA (DELETE BEFORE PRODUCTION)
-- ============================================

-- Insert test user (if needed)
-- INSERT INTO auth.users (email) VALUES ('test@example.com');

-- Note: Insert virtual cards through your app backend
-- to ensure proper encryption of card numbers and CVVs

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Check for expired cards
-- SELECT * FROM virtual_cards WHERE expires_at < NOW() AND status = 'active';

-- Check for suspicious transactions (OTP failed multiple times)
-- SELECT * FROM virtual_card_transactions 
-- WHERE otp_attempts >= 3 
-- AND created_at > NOW() - INTERVAL '1 hour';

-- Get user spending summary
-- SELECT 
--   DATE(created_at) as transaction_date,
--   COUNT(*) as transaction_count,
--   SUM(amount) as daily_spend
-- FROM virtual_card_transactions
-- WHERE user_id = 'user_id_here'
-- AND status = 'completed'
-- GROUP BY DATE(created_at)
-- ORDER BY transaction_date DESC;
