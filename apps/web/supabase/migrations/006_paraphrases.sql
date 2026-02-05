-- ============================================
-- Paraphrases - For Mayring's content analysis
-- ============================================

-- Paraphrase categories (for reduction step)
CREATE TABLE IF NOT EXISTS paraphrase_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#10b981',
  parent_id UUID REFERENCES paraphrase_categories(id) ON DELETE SET NULL,
  "order" INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE paraphrase_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access categories in their org's projects
CREATE POLICY "Users can access paraphrase_categories in their projects"
  ON paraphrase_categories FOR ALL
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organizations o ON p.organization_id = o.id
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Paraphrases table
CREATE TABLE IF NOT EXISTS paraphrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  original_text TEXT NOT NULL,
  paraphrase_text TEXT NOT NULL,
  generalization TEXT,  -- Mayring step 2
  category_id UUID REFERENCES paraphrase_categories(id) ON DELETE SET NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Note: Overlap prevention handled in application layer (like MAXQDA)
);

-- Enable RLS
ALTER TABLE paraphrases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access paraphrases in their org's projects
CREATE POLICY "Users can access paraphrases in their projects"
  ON paraphrases FOR ALL
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN organizations o ON p.organization_id = o.id
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_paraphrases_document ON paraphrases(document_id);
CREATE INDEX IF NOT EXISTS idx_paraphrases_project ON paraphrases(project_id);
CREATE INDEX IF NOT EXISTS idx_paraphrases_category ON paraphrases(category_id);
CREATE INDEX IF NOT EXISTS idx_paraphrase_categories_project ON paraphrase_categories(project_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_paraphrase_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_paraphrase_timestamp ON paraphrases;
CREATE TRIGGER update_paraphrase_timestamp
  BEFORE UPDATE ON paraphrases
  FOR EACH ROW
  EXECUTE FUNCTION update_paraphrase_timestamp();
