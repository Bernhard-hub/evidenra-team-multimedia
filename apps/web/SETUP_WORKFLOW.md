# EVIDENRA Setup Workflow

## Automatisch konfiguriert

### 1. Supabase Credentials
- `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` in `.env.local` hinzugefügt
- App verbindet sich jetzt mit echtem Supabase Backend (kein Demo-Modus)

### 2. RLS Policies für Projekte
- Migration `013_fix_projects_rls.sql` angewendet
- User können jetzt Projekte ohne Organization erstellen
- Policies: SELECT, INSERT, UPDATE, DELETE für eigene Projekte

### 3. Email Templates (lokal)
- `supabase/templates/confirm.html` - Registrierungsbestätigung
- `supabase/templates/recovery.html` - Passwort zurücksetzen
- `supabase/templates/magic_link.html` - Magic Link Login
- `supabase/templates/invite.html` - Team-Einladung

### 4. SMTP Konfiguration (lokal)
- `config.toml` mit Resend SMTP aktiviert
- `RESEND_API_KEY` in `.env.local` hinzugefügt

---

## MANUELLE SCHRITTE (Supabase Dashboard)

### SMTP für Remote-Projekt konfigurieren:

1. Öffne: https://supabase.com/dashboard/project/zvkoulhziksfxnxkkrmb/settings/auth

2. Scrolle zu **SMTP Settings** und aktiviere **Enable Custom SMTP**

3. Trage ein:
   ```
   Sender email:     noreply@evidenra.com
   Sender name:      EVIDENRA
   Host:             smtp.resend.com
   Port:             465
   Username:         resend
   Password:         re_NLZXLfmK_86TFQe2PhAoXphztxeLRFwaA
   ```

4. Klicke **Save**

### Email Templates für Remote-Projekt:

1. Öffne: https://supabase.com/dashboard/project/zvkoulhziksfxnxkkrmb/auth/templates

2. Für jedes Template (Confirm signup, Reset password, Magic Link, Invite):
   - Kopiere Subject aus `config.toml`
   - Kopiere HTML Body aus `supabase/templates/*.html`
   - Klicke **Save**

---

## Test-Credentials

| Email | Passwort |
|-------|----------|
| bernhard.strobl@kph-es.at | EvidenraTest2024 |

---

## Verifizierung

```bash
# Login testen
curl -X POST "https://zvkoulhziksfxnxkkrmb.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"bernhard.strobl@kph-es.at","password":"EvidenraTest2024"}'

# Projekt erstellen testen
# Nach erfolgreichem Login mit dem access_token:
curl -X POST "https://zvkoulhziksfxnxkkrmb.supabase.co/rest/v1/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Projekt","status":"active"}'
```

---

Erstellt: 2026-02-05
