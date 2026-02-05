-- Add missing columns to organization_members
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
