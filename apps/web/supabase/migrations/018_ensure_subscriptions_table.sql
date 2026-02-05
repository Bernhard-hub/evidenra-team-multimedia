-- Ensure organization_subscriptions table exists
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT DEFAULT 'monthly',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  seats_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_subscriptions TO anon, authenticated;

-- Simple RLS policy
DROP POLICY IF EXISTS "sub_select" ON organization_subscriptions;
DROP POLICY IF EXISTS "sub_insert" ON organization_subscriptions;
DROP POLICY IF EXISTS "sub_update" ON organization_subscriptions;
DROP POLICY IF EXISTS "sub_delete" ON organization_subscriptions;

CREATE POLICY "sub_all" ON organization_subscriptions FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
