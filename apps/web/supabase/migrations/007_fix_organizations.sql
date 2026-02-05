-- ============================================
-- Fix organizations table for proper RLS
-- ============================================

-- Add created_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE organizations ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop existing policies if they exist (they might be broken)
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;

-- Create proper RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Fix organization_members RLS policies
DROP POLICY IF EXISTS "Users can view members in their organizations" ON organization_members;
DROP POLICY IF EXISTS "Owners/admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert themselves as owners" ON organization_members;

CREATE POLICY "Users can view members in their organizations"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Allow users to add themselves as owner when creating an org
CREATE POLICY "Users can insert themselves as members"
  ON organization_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and admins can manage members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Fix organization_subscriptions RLS policies
DROP POLICY IF EXISTS "Users can view their org subscriptions" ON organization_subscriptions;
DROP POLICY IF EXISTS "Users can insert subscriptions for their orgs" ON organization_subscriptions;

CREATE POLICY "Users can view subscriptions for their organizations"
  ON organization_subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create subscriptions for their organizations"
  ON organization_subscriptions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT id FROM organizations WHERE id = organization_id
    )
  );
