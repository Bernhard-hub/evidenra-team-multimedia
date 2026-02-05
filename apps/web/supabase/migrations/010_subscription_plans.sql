-- ============================================
-- Subscription Plans - Add default plans
-- ============================================

-- Make name_de nullable if it exists
ALTER TABLE subscription_plans
ALTER COLUMN name_de DROP NOT NULL;

-- Insert default plans with all required columns
INSERT INTO subscription_plans (id, name, name_de, description, price_monthly, price_yearly, max_seats, max_projects, max_documents, max_storage_gb, features)
VALUES
  ('free', 'Free', 'Kostenlos', 'Für den Einstieg', 0, 0, 1, 2, 10, 1, '{"methodologyGuide": false, "exportFormats": ["md"], "support": "community"}'),
  ('starter', 'Starter', 'Starter', 'Für einzelne Forscher', 1900, 19000, 3, 10, 100, 5, '{"methodologyGuide": false, "exportFormats": ["md", "csv"], "support": "email"}'),
  ('team', 'Team', 'Team', 'Für Forschungsteams', 4900, 49000, 10, null, null, 25, '{"methodologyGuide": true, "exportFormats": ["md", "csv", "docx", "pdf"], "support": "priority"}'),
  ('institution', 'Institution', 'Institution', 'Für Universitäten', 9900, 99000, 50, null, null, 100, '{"methodologyGuide": true, "exportFormats": ["md", "csv", "docx", "pdf", "xml"], "support": "dedicated", "sso": true, "adminDashboard": true}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_seats = EXCLUDED.max_seats,
  max_projects = EXCLUDED.max_projects,
  max_documents = EXCLUDED.max_documents,
  max_storage_gb = EXCLUDED.max_storage_gb,
  features = EXCLUDED.features;

-- Drop the foreign key constraint on plan_id (it causes issues)
ALTER TABLE organization_subscriptions
DROP CONSTRAINT IF EXISTS organization_subscriptions_plan_id_fkey;
