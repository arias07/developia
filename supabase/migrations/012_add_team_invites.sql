-- ============================================
-- TEAM INVITES TABLE
-- For managing team member invitations
-- ============================================

-- Invite status enum
CREATE TYPE team_invite_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Team invites table
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Invite details
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  specializations TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10, 2),

  -- Token for accepting invite
  invite_token TEXT UNIQUE NOT NULL,

  -- Status tracking
  status team_invite_status NOT NULL DEFAULT 'pending',

  -- Who sent the invite
  invited_by UUID REFERENCES profiles(id),

  -- When accepted, link to the created profile/team member
  accepted_by UUID REFERENCES profiles(id),
  team_member_id UUID REFERENCES team_members(id),

  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for token lookups (most common query)
CREATE INDEX idx_team_invites_token ON team_invites(invite_token) WHERE status = 'pending';

-- Index for email lookups
CREATE INDEX idx_team_invites_email ON team_invites(email);

-- Index for status filtering
CREATE INDEX idx_team_invites_status ON team_invites(status);

-- RLS Policies
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to team_invites"
  ON team_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Anyone can read their own pending invite by token (for accepting)
CREATE POLICY "Users can read pending invites by token"
  ON team_invites
  FOR SELECT
  TO authenticated
  USING (
    status = 'pending'
    AND expires_at > NOW()
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Function to auto-expire old invites
CREATE OR REPLACE FUNCTION expire_old_team_invites()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE team_invites
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$;

-- Updated_at trigger
CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON team_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
