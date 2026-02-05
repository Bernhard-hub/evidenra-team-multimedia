-- ============================================
-- Fix Team Invitations Table
-- ============================================

-- Enable pgcrypto for secure token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS team_invitations CASCADE;

-- Recreate with correct structure
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  inviter_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled'))
);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Members can view invitations for their org
CREATE POLICY "invite_select_member"
  ON team_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "invite_select_by_token"
  ON team_invitations FOR SELECT
  USING (true);

-- Admins can create invitations
CREATE POLICY "invite_insert_admin"
  ON team_invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins can update invitations
CREATE POLICY "invite_update_admin"
  ON team_invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete invitations
CREATE POLICY "invite_delete_admin"
  ON team_invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Indexes
CREATE INDEX idx_invitations_token ON team_invitations(token);
CREATE INDEX idx_invitations_org ON team_invitations(organization_id);
CREATE INDEX idx_invitations_email ON team_invitations(email);
CREATE INDEX idx_invitations_status ON team_invitations(status);
