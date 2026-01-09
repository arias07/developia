-- ============================================
-- PLATFORM SETTINGS TABLE
-- For storing admin configuration settings
-- ============================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Settings are stored as key-value pairs with categories
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,

  -- Metadata
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint on category + key
  UNIQUE(category, key)
);

-- Index for category lookups
CREATE INDEX idx_platform_settings_category ON platform_settings(category);

-- RLS Policies
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "Admins full access to platform_settings"
  ON platform_settings
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
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO platform_settings (category, key, value) VALUES
  ('general', 'siteName', '"Devvy"'),
  ('general', 'siteUrl', '"https://devvy.tech"'),
  ('general', 'supportEmail', '"soporte@devvy.tech"'),
  ('general', 'timezone', '"America/Mexico_City"'),
  ('notifications', 'emailNotifications', 'true'),
  ('notifications', 'slackNotifications', 'false'),
  ('notifications', 'webhookUrl', '""'),
  ('notifications', 'notifyOnNewProject', 'true'),
  ('notifications', 'notifyOnPayment', 'true'),
  ('notifications', 'notifyOnEscalation', 'true'),
  ('integrations', 'stripeEnabled', 'true'),
  ('integrations', 'stripeTestMode', 'true'),
  ('integrations', 'resendEnabled', 'true'),
  ('integrations', 'githubEnabled', 'true'),
  ('integrations', 'vercelEnabled', 'true'),
  ('integrations', 'openaiEnabled', 'true'),
  ('security', 'twoFactorRequired', 'false'),
  ('security', 'sessionTimeout', '24'),
  ('security', 'ipWhitelist', '""')
ON CONFLICT (category, key) DO NOTHING;
