-- Add missing columns to codings table if needed
ALTER TABLE public.codings ADD COLUMN IF NOT EXISTS code_id UUID REFERENCES public.codes(id) ON DELETE CASCADE;

-- Enable RLS on codings
ALTER TABLE public.codings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.codings TO anon, authenticated;

DROP POLICY IF EXISTS "codings_all" ON public.codings;
CREATE POLICY "codings_all" ON public.codings FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure documents has proper permissions
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO anon, authenticated;

DROP POLICY IF EXISTS "documents_all" ON public.documents;
CREATE POLICY "documents_all" ON public.documents FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create memos table if missing
CREATE TABLE IF NOT EXISTS public.memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  code_id UUID REFERENCES public.codes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  memo_type TEXT DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memos TO anon, authenticated;

DROP POLICY IF EXISTS "memos_all" ON public.memos;
CREATE POLICY "memos_all" ON public.memos FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
