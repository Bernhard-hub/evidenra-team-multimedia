-- ============================================
-- Fix Projects RLS to allow creation without organization
-- ============================================

-- Drop ALL existing project policies (including any we might have created before)
DROP POLICY IF EXISTS "Org members can view projects" ON projects;
DROP POLICY IF EXISTS "Org members can create projects" ON projects;
DROP POLICY IF EXISTS "Project creators can update" ON projects;
DROP POLICY IF EXISTS "Org admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update" ON projects;
DROP POLICY IF EXISTS "Project owners can delete" ON projects;

-- Allow users to view their own projects (regardless of organization)
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = projects.organization_id
      AND user_id = auth.uid()
    )
  );

-- Allow authenticated users to create projects
CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Allow project owners to update their projects
CREATE POLICY "Project owners can update" ON projects
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Allow project owners or org admins to delete
CREATE POLICY "Project owners can delete" ON projects
  FOR DELETE USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = projects.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Create trigger to auto-set user_id on insert
CREATE OR REPLACE FUNCTION set_project_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_project_user_id_trigger ON projects;
CREATE TRIGGER set_project_user_id_trigger
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION set_project_user_id();
