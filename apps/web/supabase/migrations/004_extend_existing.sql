-- =====================================================
-- EVIDENRA RESEARCH - Extend Existing Schema
-- Adds team/subscription features to existing schema
-- =====================================================

-- =====================================================
-- 1. ORGANIZATIONS (Teams) - NEW
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ORGANIZATION MEMBERS - NEW
-- =====================================================
DO $$ BEGIN
  CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role organization_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- =====================================================
-- 3. PROFILES - NEW (extends existing users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. SUBSCRIPTION PLANS - NEW
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_de TEXT NOT NULL,
  description TEXT,
  description_de TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  max_seats INTEGER NOT NULL,
  max_projects INTEGER,
  max_documents INTEGER,
  max_storage_gb INTEGER NOT NULL,
  ai_credits_monthly INTEGER,
  features JSONB DEFAULT '{}',
  stripe_price_monthly TEXT,
  stripe_price_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Research plans
INSERT INTO public.subscription_plans (id, name, name_de, description, description_de, price_monthly, price_yearly, max_seats, max_projects, max_documents, max_storage_gb, ai_credits_monthly, features)
VALUES
  ('research-starter', 'Starter', 'Starter', 'For small research teams', 'Für kleine Forschungsteams', 2900, 23900, 3, 10, 100, 5, 100, '{"methodologyGuide": false}'),
  ('research-team', 'Team', 'Team', 'For professional teams', 'Für professionelle Teams', 7900, 63900, 10, NULL, NULL, 25, 1000, '{"methodologyGuide": true}'),
  ('research-institution', 'Institution', 'Institution', 'For universities', 'Für Universitäten', 19900, 159900, 50, NULL, NULL, 100, NULL, '{"methodologyGuide": true, "sso": true}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. ORGANIZATION SUBSCRIPTIONS - NEW
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  seats_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- =====================================================
-- 6. ADD organization_id TO PROJECTS (if not exists)
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- =====================================================
-- 7. MEMOS TABLE - NEW
-- =====================================================
CREATE TABLE IF NOT EXISTS public.memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  type TEXT DEFAULT 'note',
  target_type TEXT,
  target_id UUID,
  title TEXT,
  content TEXT NOT NULL,
  color TEXT DEFAULT '#fbbf24',
  tags TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memos_project ON public.memos(project_id);

-- =====================================================
-- 8. ENABLE RLS ON NEW TABLES
-- =====================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated can view own profile" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can update own profile" ON public.profiles
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated can view organizations" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage org members" ON public.organization_members
  FOR ALL USING (true);

CREATE POLICY "Authenticated can view subscriptions" ON public.organization_subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage memos" ON public.memos
  FOR ALL USING (true);

-- =====================================================
-- DONE! Schema extended for Research
-- =====================================================
