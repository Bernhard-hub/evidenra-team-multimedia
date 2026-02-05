-- =====================================================
-- Migration: Ensure Profile Function
-- Diese Funktion stellt sicher, dass ein Profil existiert
-- (falls der Trigger beim User-Erstellen nicht ausgelöst hat)
-- =====================================================

-- Funktion zum Sicherstellen dass Profil existiert
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS void AS $$
DECLARE
  current_user_id uuid;
  current_email text;
  current_name text;
BEGIN
  -- Hole aktuelle User-ID aus dem JWT
  current_user_id := auth.uid();

  -- Wenn nicht eingeloggt, nichts tun
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Prüfe ob Profil bereits existiert
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id) THEN
    RETURN;
  END IF;

  -- Hole User-Daten aus auth.users
  SELECT
    email,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
  INTO current_email, current_name
  FROM auth.users
  WHERE id = current_user_id;

  -- Erstelle Profil
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (current_user_id, current_email, current_name, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gewähre Ausführungsrechte
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists() TO authenticated;

-- =====================================================
-- RLS Policy für INSERT auf profiles
-- Erlaubt Usern, ihr eigenes Profil zu erstellen
-- =====================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- DONE
-- =====================================================
