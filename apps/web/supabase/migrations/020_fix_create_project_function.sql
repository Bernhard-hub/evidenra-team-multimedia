-- Fix create_project function to include user_id
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
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  INSERT INTO projects (organization_id, name, description, user_id, created_by)
  VALUES (p_organization_id, p_name, p_description, v_user_id, v_user_id)
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$$;
