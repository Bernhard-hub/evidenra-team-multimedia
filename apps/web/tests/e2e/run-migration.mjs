/**
 * Führt die Migration direkt in der Supabase-Datenbank aus
 */

import pg from 'pg'

const DATABASE_URL = 'postgresql://postgres.zvkoulhziksfxnxkkrmb:VTcvnFMev9GONXTv@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'

const migration = `
-- 1. Funktion erstellen, die fehlendes Profil automatisch anlegt
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS void AS $$
DECLARE
  current_user_id uuid;
  current_email text;
  current_name text;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id) THEN RETURN; END IF;

  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
  INTO current_email, current_name
  FROM auth.users WHERE id = current_user_id;

  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (current_user_id, current_email, current_name, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Rechte vergeben
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists() TO authenticated;

-- 3. RLS Policy für Profile-Insert
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
`

const insertTestUser = `
-- Test-User Profil direkt erstellen
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
VALUES (
  '9f15ca5f-7e8e-4630-9e22-e878ceb8a4e5',
  'e2e-test@evidenra.com',
  'E2E Test User',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
`

async function runMigration() {
  console.log('🔧 Verbinde mit Supabase-Datenbank...')

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Verbunden!')

    console.log('\n📦 Führe Migration aus...')
    await client.query(migration)
    console.log('✅ Migration erfolgreich!')

    console.log('\n👤 Erstelle Test-User Profil...')
    await client.query(insertTestUser)
    console.log('✅ Test-User Profil erstellt!')

    // Prüfe ob Profil existiert
    const result = await client.query(
      "SELECT id, email, full_name FROM public.profiles WHERE id = '9f15ca5f-7e8e-4630-9e22-e878ceb8a4e5'"
    )

    if (result.rows.length > 0) {
      console.log('\n✅ Profil verifiziert:')
      console.log('   ID:', result.rows[0].id)
      console.log('   Email:', result.rows[0].email)
      console.log('   Name:', result.rows[0].full_name)
    }

    console.log('\n🎉 Migration abgeschlossen!')

  } catch (error) {
    console.error('❌ Fehler:', error.message)
  } finally {
    await client.end()
  }
}

runMigration()
