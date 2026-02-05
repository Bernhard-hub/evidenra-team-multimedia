-- Add missing columns to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Make name required for new rows (can't add NOT NULL if there are existing rows with NULL)
-- UPDATE projects SET name = 'Untitled Project' WHERE name IS NULL;

-- Recreate the create_project function with correct columns
CREATE OR REPLACE FUNCTION create_project(
  p_organization_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  INSERT INTO projects (organization_id, name, description)
  VALUES (p_organization_id, p_name, p_description)
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$$;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
