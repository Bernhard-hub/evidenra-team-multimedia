-- Create codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.codes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_codes_project ON public.codes(project_id);
CREATE INDEX IF NOT EXISTS idx_codes_parent ON public.codes(parent_id);

-- Enable RLS
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.codes TO anon, authenticated;

-- Simple RLS policy (user must be authenticated)
DROP POLICY IF EXISTS "codes_all" ON public.codes;
CREATE POLICY "codes_all" ON public.codes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
