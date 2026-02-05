-- ============================================
-- Simplify RLS policies for debugging
-- ============================================

-- Drop all existing policies on organization tables
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update their organizations" ON organizations;

DROP POLICY IF EXISTS "Users can view members in their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON organization_members;

DROP POLICY IF EXISTS "Users can view subscriptions for their organizations" ON organization_subscriptions;
DROP POLICY IF EXISTS "Users can create subscriptions for their organizations" ON organization_subscriptions;

-- Simple permissive policies for organizations
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_insert" ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_delete" ON organizations FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Simple permissive policies for organization_members
CREATE POLICY "member_select" ON organization_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "member_insert" ON organization_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "member_update" ON organization_members FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "member_delete" ON organization_members FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Simple permissive policies for organization_subscriptions
CREATE POLICY "sub_select" ON organization_subscriptions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "sub_insert" ON organization_subscriptions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sub_update" ON organization_subscriptions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "sub_delete" ON organization_subscriptions FOR DELETE
  USING (auth.uid() IS NOT NULL);
