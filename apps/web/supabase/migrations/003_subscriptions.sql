-- =====================================================
-- EVIDENRA RESEARCH - Subscription & Payment Tables
-- For Stripe integration
-- =====================================================

-- =====================================================
-- 1. SUBSCRIPTION PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY, -- 'starter', 'team', 'institution'
  name TEXT NOT NULL,
  name_de TEXT NOT NULL,
  description TEXT,
  description_de TEXT,
  price_monthly INTEGER NOT NULL, -- in cents
  price_yearly INTEGER NOT NULL,  -- in cents
  max_seats INTEGER NOT NULL,
  max_projects INTEGER, -- NULL = unlimited
  max_documents INTEGER, -- NULL = unlimited
  max_storage_gb INTEGER NOT NULL,
  ai_credits_monthly INTEGER, -- NULL = unlimited
  features JSONB DEFAULT '{}',
  stripe_price_monthly TEXT,
  stripe_price_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO public.subscription_plans (id, name, name_de, description, description_de, price_monthly, price_yearly, max_seats, max_projects, max_documents, max_storage_gb, ai_credits_monthly, features)
VALUES
  ('starter', 'Starter', 'Starter', 'For small research teams', 'Für kleine Forschungsteams', 2900, 23900, 3, 10, 100, 5, 100, '{"methodologyGuide": false, "exportFormats": ["md", "csv"], "support": "email"}'),
  ('team', 'Team', 'Team', 'For professional research teams', 'Für professionelle Forschungsteams', 7900, 63900, 10, NULL, NULL, 25, 1000, '{"methodologyGuide": true, "exportFormats": ["md", "csv", "docx", "pdf"], "support": "priority"}'),
  ('institution', 'Institution', 'Institution', 'For universities and research institutions', 'Für Universitäten und Forschungseinrichtungen', 19900, 159900, 50, NULL, NULL, 100, NULL, '{"methodologyGuide": true, "exportFormats": ["all"], "support": "dedicated", "sso": true, "adminDashboard": true}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. ORGANIZATION SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing', -- 'trialing', 'active', 'past_due', 'canceled', 'expired'
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
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

CREATE INDEX idx_org_subs_stripe ON public.organization_subscriptions(stripe_subscription_id);
CREATE INDEX idx_org_subs_status ON public.organization_subscriptions(status);

-- =====================================================
-- 3. USAGE TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'ai_request', 'document_upload', 'export', etc.
  resource_type TEXT, -- 'document', 'project', 'coding', etc.
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_org_date ON public.usage_logs(organization_id, created_at DESC);

-- =====================================================
-- 4. INVOICES (mirror from Stripe)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'
  invoice_url TEXT,
  invoice_pdf TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. FEATURE FLAGS FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_organization_features(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'plan', sp.id,
    'planName', sp.name,
    'maxSeats', sp.max_seats,
    'maxProjects', COALESCE(sp.max_projects, -1),
    'maxDocuments', COALESCE(sp.max_documents, -1),
    'maxStorageGB', sp.max_storage_gb,
    'aiCreditsMonthly', COALESCE(sp.ai_credits_monthly, -1),
    'features', sp.features,
    'status', os.status,
    'seatsUsed', os.seats_used,
    'trialEnd', os.trial_end,
    'currentPeriodEnd', os.current_period_end
  ) INTO result
  FROM public.organization_subscriptions os
  JOIN public.subscription_plans sp ON sp.id = os.plan_id
  WHERE os.organization_id = org_id;

  -- Return free tier defaults if no subscription
  IF result IS NULL THEN
    result := jsonb_build_object(
      'plan', 'free',
      'planName', 'Free',
      'maxSeats', 1,
      'maxProjects', 2,
      'maxDocuments', 10,
      'maxStorageGB', 1,
      'aiCreditsMonthly', 10,
      'features', '{}',
      'status', 'free',
      'seatsUsed', 1
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Plans are public read
CREATE POLICY "Anyone can view plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Subscriptions viewable by org members
CREATE POLICY "Org members can view subscription" ON public.organization_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_subscriptions.organization_id
        AND user_id = auth.uid()
    )
  );

-- Only owners can manage subscriptions
CREATE POLICY "Owners can manage subscription" ON public.organization_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_subscriptions.organization_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Usage logs viewable by org admins
CREATE POLICY "Admins can view usage" ON public.usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = usage_logs.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Invoices viewable by org owners
CREATE POLICY "Owners can view invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = invoices.organization_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- =====================================================
-- 7. UPDATED_AT TRIGGER
-- =====================================================
CREATE TRIGGER update_org_subs_updated_at
  BEFORE UPDATE ON public.organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- DONE! Subscription system ready
-- =====================================================
