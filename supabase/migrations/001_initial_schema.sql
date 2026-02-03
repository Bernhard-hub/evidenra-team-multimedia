-- EVIDENRA Team Multimedia Database Schema
-- Initial migration: Core tables for team-based qualitative research

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ===========================================
-- PROFILES (extends Supabase auth.users)
-- ===========================================
CREATE TABLE public.profiles (
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
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- ORGANIZATIONS
-- ===========================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);

-- ===========================================
-- ORGANIZATION MEMBERS
-- ===========================================
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role organization_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);

-- ===========================================
-- INVITATIONS
-- ===========================================
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  token TEXT UNIQUE NOT NULL,
  status invitation_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- ===========================================
-- PROJECTS
-- ===========================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_org ON public.projects(organization_id);

-- ===========================================
-- PROJECT MEMBERS
-- ===========================================
CREATE TYPE project_role AS ENUM ('admin', 'coder', 'reviewer', 'viewer');

CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role project_role DEFAULT 'viewer',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);

-- ===========================================
-- DOCUMENTS
-- ===========================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT,
  file_path TEXT,
  file_type TEXT NOT NULL DEFAULT 'text',
  word_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_project ON public.documents(project_id);
CREATE INDEX idx_documents_content_search ON public.documents USING gin(content gin_trgm_ops);

-- ===========================================
-- CODES (Code Hierarchy)
-- ===========================================
CREATE TABLE public.codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.codes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#f59e0b',
  sort_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_codes_project ON public.codes(project_id);
CREATE INDEX idx_codes_parent ON public.codes(parent_id);

-- ===========================================
-- CODINGS (Applied Codes to Document Segments)
-- ===========================================
CREATE TABLE public.codings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES public.codes(id) ON DELETE CASCADE,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  memo TEXT,
  confidence DECIMAL(3, 2),
  coding_method TEXT,
  coded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_codings_document ON public.codings(document_id);
CREATE INDEX idx_codings_code ON public.codings(code_id);
CREATE INDEX idx_codings_coder ON public.codings(coded_by);

-- ===========================================
-- COMMENTS
-- ===========================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  coding_id UUID REFERENCES public.codings(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_project ON public.comments(project_id);
CREATE INDEX idx_comments_document ON public.comments(document_id);
CREATE INDEX idx_comments_coding ON public.comments(coding_id);

-- ===========================================
-- ACTIVITY LOG
-- ===========================================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_project ON public.activities(project_id);
CREATE INDEX idx_activities_user ON public.activities(user_id);
CREATE INDEX idx_activities_created ON public.activities(created_at DESC);

-- ===========================================
-- API KEYS (for Claude API storage)
-- ===========================================
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_preview TEXT NOT NULL, -- Last 4 characters
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_org ON public.api_keys(organization_id);

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read any profile, but only update their own
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Organizations: Members can view their organizations
CREATE POLICY "Organization members can view their organization"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can update"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Organization Members: Members can view other members
CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Projects: Organization members can view projects
CREATE POLICY "Organization members can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Documents: Project members can view documents
CREATE POLICY "Project members can view documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coders can create documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'coder')
    )
  );

-- Codes: Project members can view codes
CREATE POLICY "Project members can view codes"
  ON public.codes FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Coders can create codes"
  ON public.codes FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'coder')
    )
  );

-- Codings: Project members can view codings
CREATE POLICY "Project members can view codings"
  ON public.codings FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      JOIN public.project_members pm ON d.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Coders can create codings"
  ON public.codings FOR INSERT
  TO authenticated
  WITH CHECK (
    document_id IN (
      SELECT d.id FROM public.documents d
      JOIN public.project_members pm ON d.project_id = pm.project_id
      WHERE pm.user_id = auth.uid() AND pm.role IN ('admin', 'coder')
    )
  );

-- Comments: Project members can view and create comments
CREATE POLICY "Project members can view comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- Activities: Project members can view activities
CREATE POLICY "Project members can view activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- ===========================================
-- REALTIME SUBSCRIPTIONS
-- ===========================================
-- Enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE public.codings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_members;

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_codes_updated_at
  BEFORE UPDATE ON public.codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_codings_updated_at
  BEFORE UPDATE ON public.codings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_project_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activities (project_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (p_project_id, auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate project statistics
CREATE OR REPLACE FUNCTION public.get_project_stats(p_project_id UUID)
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
    (SELECT COUNT(*) FROM public.codings c JOIN public.documents d ON c.document_id = d.id WHERE d.project_id = p_project_id),
    (SELECT COUNT(*) FROM public.project_members WHERE project_id = p_project_id),
    (SELECT COALESCE(SUM(word_count), 0) FROM public.documents WHERE project_id = p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
