-- =====================================================
-- EVIDENRA RESEARCH - Initial Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. ORGANIZATIONS (Teams)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ORGANIZATION MEMBERS
-- =====================================================
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);

-- =====================================================
-- 4. PROJECTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  methodology TEXT,
  research_question TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_org ON public.projects(organization_id);

-- =====================================================
-- 5. DOCUMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT, -- For small docs, larger files use storage
  file_path TEXT, -- Supabase Storage path for large files
  file_type TEXT DEFAULT 'text',
  word_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_project ON public.documents(project_id);

-- =====================================================
-- 6. CODES (Categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.codes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_codes_project ON public.codes(project_id);
CREATE INDEX idx_codes_parent ON public.codes(parent_id);

-- =====================================================
-- 7. CODINGS (Text Segments)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.codings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES public.codes(id) ON DELETE CASCADE,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  memo TEXT,
  confidence DECIMAL(3,2),
  coding_method TEXT DEFAULT 'manual',
  coded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_codings_document ON public.codings(document_id);
CREATE INDEX idx_codings_code ON public.codings(code_id);

-- =====================================================
-- 8. MEMOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'note', -- 'note', 'theoretical', 'methodological', 'analytical'
  target_type TEXT, -- 'document', 'code', 'coding', 'project'
  target_id UUID,
  title TEXT,
  content TEXT NOT NULL,
  color TEXT DEFAULT '#fbbf24',
  tags TEXT[],
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memos_project ON public.memos(project_id);
CREATE INDEX idx_memos_target ON public.memos(target_type, target_id);

-- =====================================================
-- 9. PROJECT STATS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_project_stats(p_project_id UUID)
RETURNS TABLE (
  document_count BIGINT,
  code_count BIGINT,
  coding_count BIGINT,
  member_count BIGINT,
  word_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.documents WHERE project_id = p_project_id),
    (SELECT COUNT(*) FROM public.codes WHERE project_id = p_project_id),
    (SELECT COUNT(*) FROM public.codings c
     JOIN public.documents d ON c.document_id = d.id
     WHERE d.project_id = p_project_id),
    (SELECT COUNT(*) FROM public.organization_members om
     JOIN public.projects p ON p.organization_id = om.organization_id
     WHERE p.id = p_project_id),
    (SELECT COALESCE(SUM(word_count), 0) FROM public.documents WHERE project_id = p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations: Members can see their orgs
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organizations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owners can update organizations" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Organization Members
CREATE POLICY "Members can view other members in their org" ON public.organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_members.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Projects: Org members can access
CREATE POLICY "Org members can view projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = projects.organization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can create projects" ON public.projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = projects.organization_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project creators can update" ON public.projects
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Org admins can delete projects" ON public.projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = projects.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Documents: Project members can access
CREATE POLICY "Project members can view documents" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = documents.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create documents" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = documents.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Document creators can update" ON public.documents
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Document creators can delete" ON public.documents
  FOR DELETE USING (created_by = auth.uid());

-- Codes: Project members can access
CREATE POLICY "Project members can view codes" ON public.codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = codes.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can manage codes" ON public.codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = codes.project_id AND om.user_id = auth.uid()
    )
  );

-- Codings: Project members can access
CREATE POLICY "Project members can view codings" ON public.codings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.projects p ON p.id = d.project_id
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE d.id = codings.document_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create codings" ON public.codings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.projects p ON p.id = d.project_id
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE d.id = codings.document_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Coding creators can update/delete" ON public.codings
  FOR ALL USING (coded_by = auth.uid());

-- Memos: Project members can access
CREATE POLICY "Project members can view memos" ON public.memos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = memos.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create memos" ON public.memos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = memos.project_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Memo creators can update/delete" ON public.memos
  FOR ALL USING (created_by = auth.uid());

-- =====================================================
-- 11. UPDATED_AT TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_codes_updated_at BEFORE UPDATE ON public.codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_codings_updated_at BEFORE UPDATE ON public.codings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_memos_updated_at BEFORE UPDATE ON public.memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 12. STORAGE BUCKET FOR DOCUMENTS
-- =====================================================
-- Run this separately in Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage Policies (run in SQL editor):
-- CREATE POLICY "Authenticated users can upload documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can view their org documents"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- =====================================================
-- DONE! Schema ready for EVIDENRA Research
-- =====================================================
