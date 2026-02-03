# EVIDENRA Team Multimedia - Produktvision

**Version:** 1.0 Draft
**Datum:** 31. Januar 2026
**Status:** Konzeptphase

---

## Executive Summary

EVIDENRA Team Multimedia ist die nächste Evolution der EVIDENRA-Produktfamilie. Während EVIDENRA Ultimate für Einzelforscher optimiert ist, adressiert Team Multimedia die Bedürfnisse von **Forschungsteams, Universitäten und Institutionen**.

**Kernziele:**
- Akademische Akzeptanz durch echte ICR-Metriken
- Team-Kollaboration in Echtzeit
- Multimedia-Codierung (Video/Audio)
- AI-Integration als Differenzierungsmerkmal
- Preislich attraktive Alternative zu MAXQDA/NVivo

---

## Marktanalyse

### Aktuelle Marktsituation

| Tool | Preis/Jahr | Stärke | Schwäche |
|------|------------|--------|----------|
| MAXQDA | ~1000€ | Goldstandard, akademisch etabliert | Teuer, keine AI |
| NVivo | ~1500€ | Enterprise, Team-Features | Sehr teuer, komplex |
| ATLAS.ti | ~800€ | Netzwerk-Analyse | Veraltete UI |
| Dedoose | ~150€ | Web-basiert, günstig | Limitierte Features |

### Marktlücke

- **Kein Tool** kombiniert echte AI-Integration mit Team-Features
- **Kein Tool** bietet Real-time Collaboration
- **Preislücke** zwischen Dedoose (basic) und MAXQDA (premium)

### Zielgruppe

1. **Primär:** Forschungsteams an Universitäten (3-10 Personen)
2. **Sekundär:** Marktforschungsagenturen
3. **Tertiär:** NGOs, Think Tanks, Consultancies

---

## Feature-Übersicht

### 1. Inter-Coder-Reliability (ICR)

**Das wichtigste Feature für akademische Akzeptanz.**

```
ICR-Metriken:
├── Krippendorff's Alpha (Goldstandard)
├── Cohen's Kappa (2 Coder)
├── Fleiss' Kappa (n Coder)
├── Scott's Pi
└── Percentage Agreement
```

**Workflow:**
1. Admin erstellt ICR-Session
2. Coder arbeiten im Blind-Modus
3. System berechnet Übereinstimmung
4. Disagreements werden markiert
5. Team diskutiert & löst auf
6. Finale Metriken für Publikation

### 2. Team-Kollaboration

```
Features:
├── Projekt-Sharing mit Rollen
│   ├── Admin (volle Kontrolle)
│   ├── Coder (codieren, kommentieren)
│   ├── Reviewer (lesen, kommentieren)
│   └── Viewer (nur lesen)
│
├── Real-time Sync
│   ├── Presence-Indikatoren
│   ├── Live-Cursor (wie Google Docs)
│   └── Konflikt-Resolution
│
├── Kommentare & Diskussionen
│   ├── An Dokumenten
│   ├── An Codings
│   └── An Kategorien
│
└── Audit-Trail
    ├── Wer hat wann was geändert
    ├── Version-History
    └── Rollback-Möglichkeit
```

### 3. Multimedia-Codierung

**Video:**
```
├── Timeline-basiertes Coding
├── In/Out-Punkte mit Tastatur
├── Frame-genaue Markierung
├── Waveform-Overlay
├── Playback: 0.5x - 2x Speed
├── Segment-Export (Clips)
└── Thumbnail-Vorschau
```

**Audio:**
```
├── Waveform-Visualisierung
├── Speaker-Diarization
├── Timestamp-Sync mit Transkript
└── Noise-Reduction (optional)
```

**Transkription:**
```
├── Auto-Transkription
│   ├── OpenAI Whisper API
│   ├── AssemblyAI (optional)
│   └── Lokales Whisper (optional)
│
├── Manuelle Bearbeitung
│   ├── Inline-Editor
│   ├── Sprecher-Labels
│   └── Timestamp-Korrektur
│
└── Import/Export
    ├── SRT, VTT, TXT
    ├── Word (.docx)
    └── REFI-QDA
```

### 4. AI-Integration (Nexus Evolution)

Von Ultimate portiert und erweitert:

```
├── Multi-Provider (Claude, GPT, Groq, etc.)
├── Projekt-Kontext-Awareness
├── Coding-Vorschläge
├── Methodologie-Guidance
│
└── NEU für Team:
    ├── Team-weite Prompts
    ├── Konsistenz-Prüfung über Coder
    ├── AI-gestützte ICR-Analyse
    └── Automatische Disagreement-Erklärung
```

### 5. Export & Akademische Integration

```
├── Daten-Export
│   ├── Excel (formatiert)
│   ├── SPSS (.sav)
│   ├── R (.rds)
│   └── CSV
│
├── Report-Export
│   ├── Word (APA/MLA-formatiert)
│   ├── PDF
│   └── LaTeX
│
├── Interoperabilität
│   ├── REFI-QDA Standard
│   ├── MAXQDA Import/Export
│   └── NVivo Import/Export
│
└── ICR-Reports
    ├── Publikationsfertig
    ├── Mit Visualisierungen
    └── Methodenbeschreibung
```

---

## Technologie-Architektur

### Entscheidung: Web-First

**Warum Web-First:**
- Teams arbeiten verteilt → Browser überall verfügbar
- Kein Installations-Aufwand für IT-Abteilungen
- Einfacheres Deployment & kontinuierliche Updates
- Real-time Collaboration natürlicher im Web
- Desktop-Client später als Electron-Wrapper möglich

### Stack-Empfehlung

```
Backend:
├── Runtime: Node.js 20 LTS
├── Framework: Fastify (schneller als Express)
├── Database: PostgreSQL 16
├── Cache/Realtime: Redis 7
├── Media Storage: Cloudflare R2 (S3-kompatibel, günstiger)
├── Search: Meilisearch (einfacher als Elasticsearch)
└── Queue: BullMQ (für Media-Processing)

Frontend:
├── Framework: React 18 + TypeScript
├── State: Zustand (wie Ultimate)
├── Realtime: Yjs (CRDT für Collaboration)
├── UI: Tailwind + Radix UI
├── Charts: Recharts (wie Ultimate)
└── Video: Video.js + Custom Timeline

DevOps:
├── Container: Docker
├── Orchestration: Docker Compose → Kubernetes später
├── CI/CD: GitHub Actions
├── Hosting: Hetzner Cloud (EU, DSGVO-konform)
└── CDN: Cloudflare
```

### Datenmodell (Vereinfacht)

```sql
-- Core Entities
organizations
users
projects
project_members (user + role)

-- Documents
documents
document_versions
media_files
transcripts

-- Coding
categories
codes
codings
coding_comments

-- ICR
icr_sessions
icr_assignments
icr_results

-- Collaboration
comments
activities (audit log)
presence (realtime)
```

---

## Entwicklungs-Roadmap

### Phase 1: Foundation (2-3 Monate)
- Backend-Setup mit Auth
- Projekt- & Team-Management
- Dokument-Upload & -Verwaltung
- Basis-Coding (wie Ultimate)
- Web-App Grundgerüst

### Phase 2: Collaboration (2-3 Monate)
- Real-time Sync mit Yjs
- Kommentar-System
- Presence-Indikatoren
- Version-History
- Konflikt-Resolution

### Phase 3: ICR-System (1-2 Monate)
- Kappa-Berechnungen
- Blind-Coding-Modus
- Vergleichs-Interface
- ICR-Reports
- Disagreement-Workflow

### Phase 4: Audio & Transkription (2 Monate)
- Audio-Player mit Waveform
- Whisper-Integration
- Transkript-Editor
- Timestamp-Sync
- Speaker-Labels

### Phase 5: Video-Coding (2-3 Monate)
- Video-Player
- Timeline-Interface
- Segment-Marking
- Thumbnail-Preview
- Clip-Export

### Phase 6: Polish & Launch (1-2 Monate)
- Export-Formate
- Akademische Templates
- Dokumentation
- Beta-Testing
- Marketing-Website

**Gesamt: 10-14 Monate**

---

## Pricing-Strategie

| Tier | Users | Features | Preis |
|------|-------|----------|-------|
| **Solo** | 1 | Multimedia, AI, kein Team | 19€/Monat |
| **Team** | 5 | + ICR, Collaboration | 49€/Monat |
| **Team Plus** | 15 | + Priority Support | 99€/Monat |
| **Institution** | Unbegrenzt | + SSO, Admin-Dashboard | 199€/Monat |
| **Enterprise** | Unbegrenzt | + On-Premise, Custom | Auf Anfrage |

**Akademischer Rabatt:** 50% für verifizierte Universitäten

---

## Wettbewerbsvorteile

| Feature | MAXQDA | NVivo | ATLAS.ti | **EVIDENRA TM** |
|---------|:------:|:-----:|:--------:|:---------------:|
| Team-Collaboration | ✓ | ✓ | ✓ | ✓ |
| **Real-time Sync** | ✗ | ✗ | Cloud | **✓** |
| ICR-Metriken | ✓ | ✓ | ✓ | ✓ |
| Video-Coding | ✓ | ✓ | ✓ | ✓ |
| Auto-Transkription | Plugin | Plugin | ✗ | **✓** |
| **AI-Assistent** | ✗ | Basic | Basic | **✓✓✓** |
| Web-App | ✗ | ✗ | ✓ | **✓** |
| **Preis** | $$$ | $$$ | $$ | **$** |

**Unique Selling Points:**
1. **AI-Integration** - Kein Wettbewerber hat das auf diesem Level
2. **Real-time Collaboration** - Echtes Google-Docs-Feeling
3. **Preis-Leistung** - 1/5 des Preises von MAXQDA
4. **Modern UX** - Keine 2005-UI wie bei der Konkurrenz

---

## Risiken & Mitigationen

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| Media-Storage-Kosten | Hoch | R2 statt S3, Compression, Limits |
| Real-time Komplexität | Mittel | Yjs ist battle-tested |
| Akademische Akzeptanz | Hoch | Case Studies, Publikationen |
| Support-Last | Mittel | Gute Docs, Community-Forum |
| Konkurrenz-Reaktion | Niedrig | Geschwindigkeit, AI-Vorsprung |

---

## Erfolgskriterien

### Jahr 1:
- [ ] MVP live mit Team + ICR
- [ ] 100 zahlende Teams
- [ ] 3 akademische Case Studies
- [ ] Break-even bei Serverkosten

### Jahr 2:
- [ ] Vollständige Multimedia-Features
- [ ] 500 zahlende Teams
- [ ] Erste Universität als Institution
- [ ] Profitabilität

### Jahr 3:
- [ ] 2000+ Teams
- [ ] Enterprise-Kunden
- [ ] Marktanteil ~5% im DACH-Raum

---

## Nächste Schritte

1. **Phase 1 detailliert planen** ← Aktuell
2. Technologie-Prototyp erstellen
3. Design-Mockups für Core-Features
4. MVP-Scope finalisieren
5. Entwicklung starten

---

*EVIDENRA Team Multimedia - Qualitative Forschung für Teams, powered by AI*
