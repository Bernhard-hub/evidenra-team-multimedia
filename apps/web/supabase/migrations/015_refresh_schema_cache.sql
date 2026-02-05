-- This migration forces a schema cache refresh

-- Ensure the table is exposed in the API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO anon, authenticated;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Add a comment to trigger cache invalidation
COMMENT ON TABLE public.projects IS 'Research projects for qualitative data analysis';
