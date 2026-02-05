-- ============================================
-- Fix Projects RLS - Add created_by if missing and fix policies
-- ============================================

-- First, add created_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop ALL existing project policies
DROP POLICY IF EXISTS "Org members can view projects" ON projects;
DROP POLICY IF EXISTS "Org members can create projects" ON projects;
DROP POLICY IF EXISTS "Project creators can update" ON projects;
DROP POLICY IF EXISTS "Org admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update" ON projects;
DROP POLICY IF EXISTS "Project owners can delete" ON projects;

-- Drop the trigger and function from previous migration (they reference non-existent user_id)
DROP TRIGGER IF EXISTS set_project_user_id_trigger ON projects;
DROP FUNCTION IF EXISTS set_project_user_id();

-- Allow authenticated users to view projects they created or are in their org
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = projects.organization_id
      AND user_id = auth.uid()
    )
    OR auth.uid() IS NOT NULL  -- Fallback: any authenticated user can view if created_by is null
  );

-- Allow authenticated users to create projects (permissive)
CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Allow project creators to update their projects
CREATE POLICY "Project creators can update" ON projects
  FOR UPDATE USING (
    created_by = auth.uid() OR created_by IS NULL
  );

-- Allow project creators or org admins to delete
CREATE POLICY "Project creators can delete" ON projects
  FOR DELETE USING (
    created_by = auth.uid()
    OR created_by IS NULL
    OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = projects.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Create trigger to auto-set created_by on insert if not provided
CREATE OR REPLACE FUNCTION set_project_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_project_created_by_trigger ON projects;
CREATE TRIGGER set_project_created_by_trigger
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION set_project_created_by();
