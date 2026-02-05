-- =====================================================
-- EVIDENRA RESEARCH - Storage Bucket Setup
-- Run this AFTER 001_initial_schema.sql
-- =====================================================

-- Create documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB max file size
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
        'video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for documents bucket

-- Policy: Authenticated users can upload to their project folders
CREATE POLICY "Users can upload to project folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- Policy: Users can view documents in their organization's projects
CREATE POLICY "Users can view org documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.projects p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE om.user_id = auth.uid()
  )
);

-- =====================================================
-- DONE! Storage bucket ready
-- =====================================================
