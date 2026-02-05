-- ============================================
-- Team Invitations System
-- ============================================

-- Drop old table if exists with wrong structure
DROP TABLE IF EXISTS team_invitations CASCADE;

-- Invitations table
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),

  -- Prevent duplicate pending invitations
  UNIQUE(organization_id, email, status)
);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view invitations for their org"
  ON team_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update invitations"
  ON team_invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete invitations"
  ON team_invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
  ON team_invitations FOR SELECT
  USING (true);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON team_invitations(email);
