-- Add created_by column to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add other potentially missing columns
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'text';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
