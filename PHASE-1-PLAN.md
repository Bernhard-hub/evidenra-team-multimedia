# EVIDENRA Team Multimedia - Phase 1 Plan

**Version:** 1.0
**Datum:** 31. Januar 2026
**Status:** Planungsphase

---

## Bestehende Infrastruktur-Analyse

### Was bereits vorhanden ist

#### 1. Supabase Backend (Bereits produktiv)

**Aktuelle Tabellen:**
```sql
-- Bereits in Produktion (EVIDENRA Ultimate/Basic)
users              -- Auth, Trial, Premium, Admin-Flag
projects           -- Projekte pro User
documents          -- Dokumente im Projekt
categories         -- Kategoriensystem
codings            -- Codierungen/Annotations
sync_sessions      -- Multi-Client-Sync
```

**Features bereits implementiert:**
- OTP-basierte Authentifizierung (keine Passwörter)
- 30-Tage Trial-System
- Gumroad-Integration für Premium-Upgrades
- Admin-System (is_admin Flag)
- Realtime Subscriptions (postgres_changes)

**Supabase URL:** `https://[project-id].supabase.co`
**Aktueller Plan:** Vermutlich Free Tier (500MB DB, 1GB Storage)

#### 2. GenesisSyncService (Voll funktionsfähig)

```
Bestehende Sync-Features:
├── Multi-Client Support (PWA, Basic, Pro, Ultimate)
├── Offline Queue mit auto-sync
├── Realtime WebSocket Updates
├── Konflikt-Resolution (Last-Write-Wins)
├── Delta Sync (nur Änderungen)
└── Client-Type Detection
```

**Kann direkt wiederverwendet werden für:**
- Projekt-Synchronisation
- Dokument-Sync
- Kategorie-Sync
- Coding-Sync

#### 3. React-Komponenten (aus Ultimate)

**Direkt portierbar:**
- NexusAIChat (AI-Assistent)
- Kategorie-System UI
- Coding-Interface
- Dokument-Viewer
- Export-Funktionen

#### 4. Domain & Hosting

**Vorhanden:**
- `evidenra.com` (Hauptdomain)
- `basic.evidenra.com` (PWA bereits live)

**Geplant:**
- `team.evidenra.com` (Team Multimedia Web-App)

---

## Kosten-Analyse

### Aktuelle Kosten (geschätzt)

| Dienst | Plan | Kosten/Monat |
|--------|------|--------------|
| Supabase | Free Tier | 0€ |
| Domain | evidenra.com | ~1€ (jährlich) |
| **Gesamt aktuell** | | **~0€/Monat** |

### Kosten für Team Multimedia

| Dienst | Plan | Kosten/Monat | Warum |
|--------|------|--------------|-------|
| Supabase | Pro | **25€** | 8GB DB, 100GB Storage, mehr Connections |
| Cloudflare R2 | Pay-as-you-go | ~**5-20€** | Media-Storage (Video/Audio) |
| Hetzner Cloud | CX21 | **5€** | Web-App Hosting |
| Cloudflare | Free | 0€ | CDN, DDoS-Schutz |
| Whisper API | Pay-as-you-go | ~**10-50€** | Transkription (abhängig von Nutzung) |
| **Gesamt Phase 1** | | **~45-100€/Monat** |

### Break-Even Berechnung

| Szenario | Teams | Revenue | Server-Kosten | Profit |
|----------|-------|---------|---------------|--------|
| Minimum | 5 Teams × 49€ | 245€ | 100€ | **+145€** |
| Ziel Jahr 1 | 20 Teams × 49€ | 980€ | 150€ | **+830€** |
| Jahr 2 | 100 Teams × 49€ | 4.900€ | 300€ | **+4.600€** |

**Break-Even: ~3 zahlende Teams**

---

## Phase 1: Foundation (8-12 Wochen)

### Sprint 1: Projekt-Setup & Auth (Wochen 1-2)

#### 1.1 Repository & Tooling

```bash
evidenra-team-multimedia/
├── apps/
│   ├── web/              # React Web-App (Vite)
│   └── api/              # Fastify Backend (optional, falls Supabase nicht reicht)
├── packages/
│   ├── ui/               # Shared UI Components
│   ├── core/             # Business Logic (von Ultimate portiert)
│   └── supabase/         # Supabase Client & Types
├── supabase/
│   └── migrations/       # SQL Migrations
└── docker-compose.yml    # Local Development
```

**Tasks:**
- [ ] Monorepo mit pnpm Workspaces
- [ ] Vite + React 18 + TypeScript Setup
- [ ] Tailwind CSS + Radix UI
- [ ] ESLint + Prettier Konfiguration
- [ ] Supabase CLI für lokale Entwicklung

#### 1.2 Datenbank-Erweiterung

**Neue Tabellen für Team-Support:**

```sql
-- Organizations (Teams/Institutionen)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'team', -- solo, team, team_plus, institution
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'coder', -- admin, coder, reviewer, viewer
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);

-- Projects now belong to organizations
ALTER TABLE projects
  ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Project Members (für projekt-spezifische Rollen)
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'coder',
  UNIQUE(project_id, user_id)
);
```

**Row Level Security (RLS):**

```sql
-- Organizations: Nur Mitglieder sehen ihre Org
CREATE POLICY "org_members_only" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Projects: Nur Org-Mitglieder sehen Projekte
CREATE POLICY "project_org_members" ON projects
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

#### 1.3 Authentication Flow

**Bestehend (wiederverwendbar):**
- OTP via Email (6-Digit Code)
- Session Management via Supabase Auth

**Neu:**
- Team-Einladung per Email
- Pending Invitations
- Role Selection bei Beitritt

```typescript
// Einladungs-Flow
async function inviteToOrganization(email: string, orgId: string, role: string) {
  // 1. Einladung in DB speichern
  await supabase.from('organization_invites').insert({
    email,
    organization_id: orgId,
    role,
    token: generateInviteToken()
  });

  // 2. Email senden (Supabase Edge Function oder externer Service)
  await sendInviteEmail(email, inviteLink);
}
```

### Sprint 2: Team-Management UI (Wochen 3-4)

#### 2.1 Dashboard

```
team.evidenra.com
├── / (Dashboard)
│   ├── Projekte-Übersicht
│   ├── Team-Mitglieder online
│   └── Aktivitäts-Feed
├── /org/settings
│   ├── Team-Name
│   ├── Billing
│   └── Mitglieder verwalten
├── /projects
│   └── Projekt-Liste
└── /project/:id
    └── Projekt-Workspace
```

#### 2.2 Komponenten (von Ultimate portieren)

| Ultimate Komponente | Team Multimedia Adaption |
|---------------------|-------------------------|
| ProjectList | + Org-Filter, + Shared-Badge |
| DocumentList | + Last-Editor-Anzeige |
| CategoryTree | + Synchronisiert über Users |
| CodingPanel | + Coder-Attribution |
| NexusAIChat | + Team-Prompts |

### Sprint 3: Projekt-Workspace (Wochen 5-6)

#### 3.1 Core Coding-Interface

**Von Ultimate übernehmen:**
- Dokument-Viewer mit Highlighting
- Kategorie-Sidebar
- Drag & Drop Coding
- Memo-System

**Neu für Team:**
- Andere User sehen (Presence)
- Farbige Cursor pro User
- Echtzeit-Updates der Codings

#### 3.2 Realtime mit Supabase (vorhandene Basis erweitern)

```typescript
// Bestehende Realtime-Subscription erweitern
const channel = supabase
  .channel(`project:${projectId}`)
  .on('postgres_changes', { event: '*', table: 'codings' }, handleCodingChange)
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .subscribe();

// Presence für User-Cursor
channel.track({
  user_id: user.id,
  email: user.email,
  cursor_position: { doc_id, char_index },
  color: getUserColor(user.id)
});
```

### Sprint 4: Basis-Features (Wochen 7-8)

#### 4.1 Kommentar-System

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  target_type TEXT, -- 'document', 'coding', 'category'
  target_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  parent_id UUID REFERENCES comments(id) -- für Threads
);
```

#### 4.2 Aktivitäts-Log

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'created_coding', 'added_document', etc.
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4.3 Export-Funktionen (von Ultimate)

- Excel Export (xlsx)
- Word Export mit Formatierung
- CSV für Statistik-Software

---

## Subdomain-Setup: team.evidenra.com

### DNS-Konfiguration

```
# Cloudflare DNS Records für evidenra.com
team.evidenra.com    CNAME    [hetzner-server-ip oder cloudflare-pages]
api.evidenra.com     CNAME    [supabase-url] (optional, für custom domain)
```

### Hosting-Optionen

**Option A: Cloudflare Pages (Empfohlen für Start)**
- Kostenlos für Static Sites
- Automatisches Deploy von GitHub
- Global CDN
- SSL inklusive

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          projectName: evidenra-team
          directory: apps/web/dist
```

**Option B: Hetzner Cloud VPS (für mehr Kontrolle)**
- CX21: 2 vCPU, 4GB RAM, 40GB SSD = 5€/Monat
- Docker + Nginx
- Eigenes SSL mit Let's Encrypt

---

## Tech-Stack Finalisierung

### Frontend

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@supabase/supabase-js": "^2.39.0",
    "zustand": "^4.5.0",          // State (wie Ultimate)
    "@tanstack/react-query": "^5.17.0",  // Server State
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "recharts": "^2.10.0",        // Charts (wie Ultimate)
    "@tabler/icons-react": "^2.46.0"  // Icons (wie Ultimate)
  }
}
```

### Backend (Supabase + Optional Fastify)

```
Supabase:
├── Auth (OTP, Session)
├── Database (PostgreSQL)
├── Realtime (WebSocket)
├── Storage (Dokumente)
└── Edge Functions (Webhooks, Email)

Optional Fastify (falls nötig):
├── Komplexe Business-Logik
├── ICR-Berechnung (Phase 3)
├── Whisper-Integration (Phase 4)
└── Media-Processing (Phase 5)
```

---

## Wiederverwendbare Assets von Ultimate

### Code direkt übertragbar

| Datei/Modul | LOC | Anpassung nötig |
|-------------|-----|-----------------|
| `supabase.ts` | 515 | Minimal (neue Tabellen hinzufügen) |
| `GenesisSyncService.ts` | 1025 | Erweitern für Team-Context |
| `NexusAIChat.tsx` | 1974 | Team-Prompts hinzufügen |
| Category-Komponenten | ~500 | Styling anpassen |
| Export-Services | ~800 | Direkt nutzbar |
| **Gesamt** | **~4800** | ~80% wiederverwendbar |

### UI-Design-System

```
Von Ultimate übernehmen:
├── Farbpalette (Slate/Amber)
├── Tailwind Config
├── Dark Mode Support
├── Responsive Breakpoints
└── Animation Presets
```

---

## Meilensteine Phase 1

| Woche | Meilenstein | Deliverable |
|-------|-------------|-------------|
| 2 | Projekt-Setup complete | Repo, CI/CD, Dev-Environment |
| 4 | Auth + Team-Management | Login, Org erstellen, Members einladen |
| 6 | Coding-Interface | Dokumente + Kategorien + Codings |
| 8 | MVP Ready | team.evidenra.com live mit Basis-Features |

---

## Risiken Phase 1

| Risiko | Mitigation |
|--------|------------|
| Supabase Free Tier Limits | Früh auf Pro upgraden (~25€/Monat) |
| Realtime-Complexity | Yjs erstmal auslassen, native Supabase Realtime |
| Component-Porting aufwendig | Nur essentielle Komponenten portieren |

---

## Nächste Schritte

1. **Sofort:** Supabase-Projekt für Team Multimedia erstellen
2. **Woche 1:** Repository aufsetzen, CI/CD konfigurieren
3. **Woche 2:** Datenbank-Migrations schreiben & testen
4. **Woche 3:** Auth-Flow implementieren
5. **Woche 4:** Team-Management UI

---

*EVIDENRA Team Multimedia - Phase 1 Plan*
*Geschätzte Entwicklungszeit: 8-12 Wochen*
*Geschätzte Kosten: 45-100€/Monat*
