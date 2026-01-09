-- ============================================
-- WITHDRAWAL REQUESTS TABLE
-- For freelancer payment withdrawal requests
-- ============================================

-- Withdrawal status enum
DO $$ BEGIN
  CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Freelancer info
  freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,

  -- Amount details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) GENERATED ALWAYS AS (amount - fee) STORED,

  -- Payment method details
  payment_method TEXT NOT NULL, -- 'bank_transfer', 'paypal', 'wise', 'crypto'
  payment_details JSONB NOT NULL DEFAULT '{}', -- Bank account, PayPal email, etc.

  -- Status tracking
  status withdrawal_status NOT NULL DEFAULT 'pending',
  status_reason TEXT, -- Reason for rejection/cancellation

  -- Processing info
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  payment_reference TEXT, -- Transaction ID from payment processor

  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_withdrawal_requests_freelancer ON withdrawal_requests(freelancer_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_requested_at ON withdrawal_requests(requested_at DESC);

-- RLS Policies
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Freelancers can view their own requests
CREATE POLICY "Freelancers can view own withdrawal requests"
  ON withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (
    freelancer_id IN (
      SELECT id FROM freelancer_profiles WHERE user_id = auth.uid()
    )
  );

-- Freelancers can create withdrawal requests
CREATE POLICY "Freelancers can create withdrawal requests"
  ON withdrawal_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    freelancer_id IN (
      SELECT id FROM freelancer_profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins full access to withdrawal_requests"
  ON withdrawal_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add payment_method to freelancer_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'freelancer_profiles' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE freelancer_profiles ADD COLUMN payment_method TEXT;
    ALTER TABLE freelancer_profiles ADD COLUMN payment_details JSONB DEFAULT '{}';
  END IF;
END $$;
