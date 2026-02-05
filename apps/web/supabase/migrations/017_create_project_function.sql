-- Create a function to insert projects that bypasses schema cache issues
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_project(UUID, TEXT, TEXT) TO authenticated;
