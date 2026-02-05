-- =====================================================
-- EVIDENRA RESEARCH - Safe Schema Extension
-- Skips existing objects, no errors
-- =====================================================

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATION ROLE TYPE
DO $$ BEGIN
  CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role organization_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

-- 4. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBSCRIPTION PLANS
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

-- Insert plans (ignore if exist)
INSERT INTO public.subscription_plans (id, name, name_de, price_monthly, price_yearly, max_seats, max_storage_gb, features)
VALUES
  ('research-starter', 'Starter', 'Starter', 2900, 23900, 3, 5, '{}'),
  ('research-team', 'Team', 'Team', 7900, 63900, 10, 25, '{"methodologyGuide": true}'),
  ('research-institution', 'Institution', 'Institution', 19900, 159900, 50, 100, '{"methodologyGuide": true, "sso": true}')
ON CONFLICT (id) DO NOTHING;

-- 6. ORGANIZATION SUBSCRIPTIONS
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
  seats_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- 7. MEMOS
CREATE TABLE IF NOT EXISTS public.memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  type TEXT DEFAULT 'note',
  target_type TEXT,
  target_id UUID,
  title TEXT,
  content TEXT NOT NULL,
  color TEXT DEFAULT '#fbbf24',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ADD organization_id TO PROJECTS
DO $$ BEGIN
  ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 9. ENABLE RLS (safe)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

-- 10. CREATE POLICIES (drop first if exist)
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public organizations" ON public.organizations;
CREATE POLICY "Public organizations" ON public.organizations FOR ALL USING (true);

DROP POLICY IF EXISTS "Public org_members" ON public.organization_members;
CREATE POLICY "Public org_members" ON public.organization_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Public subscriptions" ON public.organization_subscriptions;
CREATE POLICY "Public subscriptions" ON public.organization_subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public memos" ON public.memos;
CREATE POLICY "Public memos" ON public.memos FOR ALL USING (true);

-- DONE
SELECT 'Schema extended successfully!' as result;
