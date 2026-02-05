# EVIDENRA Visualisierung & Analyse Roadmap

## Wettbewerbsanalyse: Die Platzhirsche

### MAXQDA 2024/2025
**Preis:** ~800-1500 EUR (Analytics Pro)

**Was sie haben:**
- **Trends Feature Pack** - Code-Trends, Word-Trends, Category-Trends uber Zeit
- **AI Assist** - Automatisches Summarizing, Code-Vorschlaege (45 Sprachen)
- **Code Cloud** - mit Subcodes
- **Code Relations Browser** - Co-Occurrence Visualisierung
- **MAXMaps** - Concept Mapping mit eingebetteten Bildern
- **Survey Analysis Workspace** - Multi-Survey Management
- **Mixed Methods Worksheet** - Creswell-Framework Integration
- **Project Timeline Tool** - Heatmap der Projektaktivitaet

**Was wir NICHT haben:**
- Code-Trends uber Zeit
- Project Timeline Heatmap
- Mixed Methods Worksheet
- Survey Analysis Workspace (Multi-Survey)

---

### ATLAS.ti 24/25
**Preis:** ~800-1200 EUR

**Was sie haben:**
- **Intentional AI Coding** - Intent-basierte KI-Codierung
- **AI Summaries** - Automatische Zusammenfassungen in Memos
- **Network Editor** - Volle Netzwerk-Visualisierung mit Zoom/Navigation
- **Code Co-Occurrence Tables** - mit Heatmap-Diagrammen
- **Sankey Diagrams** - Fluss-Visualisierungen
- **Sentiment Maps** - Stimmungsanalyse
- **Word Clouds** - Interaktiv
- **Auto-Transcription** - 30+ Sprachen mit Speaker Detection
- **AI Regions** - Datenverarbeitungs-Standort waehlbar

**Was wir NICHT haben:**
- Sankey Diagrams
- Sentiment Analysis/Maps
- Voller Network Editor mit Zoom
- Speaker Detection bei Transkription

---

### NVivo 15
**Preis:** ~1200-2000 EUR

**Was sie haben:**
- **PCA Visualization** - Principal Component Analysis (neu in 15.3)
- **Word Trees** - Hierarchische Wort-Visualisierung
- **Framework Matrix** - mit AI-Summaries in Zellen
- **Crosstabs** - Pattern-Erkennung
- **Comparison Diagrams** - Vergleichsansichten
- **Mind Maps & Concept Maps** - Integriert
- **Collaboration Cloud** - Team-Features
- **XLSTAT Export** - Statistische Erweiterung

**Was wir NICHT haben:**
- PCA Visualization
- Word Trees
- Framework Matrix
- Crosstabs-Funktion
- Collaboration Cloud

---

## EVIDENRA Unique Selling Points (Behalten!)

1. **AKIH-Methodik** - Einzigartige automatische Kodierung
2. **Nexus AI Chat** - Direkter Dialog mit Daten
3. **Persona-basierte Codierung** - Profilvergleiche
4. **Fragebogen-Entwicklung** - Integrierte Skalen-Validierung
5. **ZIS/GESIS Integration** - Wissenschaftliche Skalen-Datenbank
6. **LimeSurvey/Qualtrics Export** - Direkte Survey-Integration
7. **Preis** - Deutlich guenstiger als Konkurrenz

---

## Visualisierung Implementation Plan

### Phase 1: Quick Wins (1-2 Wochen)
*Sofortiger sichtbarer Nutzen, einfach zu implementieren*

#### 1.1 Code-Haeufigkeits-Diagramme
```
Komponente: CodeFrequencyChart
Library: Recharts (bereits im Projekt!)
Features:
- Horizontales Balkendiagramm
- Sortierung nach Haeufigkeit
- Farbcodierung nach Code-Farben
- Klick -> Filter auf Code
- Export als PNG/SVG
```

#### 1.2 Code-Verteilung ueber Dokumente
```
Komponente: CodeDistributionHeatmap
Library: Recharts oder nivo
Features:
- Matrix: Dokumente x Codes
- Farbintensitaet = Haeufigkeit
- Hover zeigt Details
- Zeilen/Spalten sortierbar
```

#### 1.3 Code-Co-Occurrence Matrix
```
Komponente: CoOccurrenceHeatmap
Library: nivo (ResponsiveHeatMap)
Features:
- Codes x Codes Matrix
- Heatmap-Farben fuer Staerke
- Klick oeffnet gefilterte Segmente
- Symmetrische/Asymmetrische Ansicht
```

---

### Phase 2: Differenzierung (2-4 Wochen)
*Features die uns von MAXQDA/ATLAS.ti abheben*

#### 2.1 AKIH Kategoriensystem-Netzwerk
```
Komponente: CategoryNetworkGraph
Library: vis-network oder D3.js
Features:
- Hierarchisches Layout (Kern -> Kategorien -> Subkategorien)
- Interaktives Zoom/Pan
- Nodes = Kategorien mit Code-Anzahl
- Edges = Beziehungen aus AKIH
- Drag & Drop Reorganisation
- Cluster-Erkennung
```

#### 2.2 Persona-Radar-Diagramme
```
Komponente: PersonaRadarChart
Library: Recharts (RadarChart)
Features:
- Achsen = Kategorien/Dimensionen
- Profile vergleichen (Overlay)
- Normierte Werte (0-100%)
- Export fuer Berichte
```

#### 2.3 Code-Trends Timeline
```
Komponente: CodeTrendsTimeline
Library: Recharts (AreaChart)
Features:
- X-Achse = Dokumente/Zeit
- Y-Achse = Code-Haeufigkeit
- Stacked Areas fuer mehrere Codes
- Zoom auf Zeitraum
```

---

### Phase 3: Fragebogen-Analyse Dashboard (3-4 Wochen)
*Das fehlt ALLEN Konkurrenten in dieser Tiefe!*

#### 3.1 Psychometrische Kennzahlen-Dashboard
```
Komponente: PsychometricsDashboard
Features:
- Cronbach's Alpha (Gesamt + pro Dimension)
- Item-Trennschaerfe (korrigierte Item-Total-Korrelation)
- Schwierigkeitsindex pro Item
- Item-Charakteristik-Kurven (IRT)
- Ampel-System (rot/gelb/gruen)
```

#### 3.2 Faktorenanalyse-Visualisierung
```
Komponente: FactorAnalysisView
Features:
- Scree Plot (Eigenwerte)
- Faktor-Ladungs-Matrix (Heatmap)
- Faktor-Rotation visualisiert (2D Plot)
- Item-Zuordnung zu Faktoren
- Modell-Fit-Indices
```

#### 3.3 Antwort-Verteilungs-Charts
```
Komponente: ResponseDistribution
Features:
- Histogramme pro Item
- Likert-Scale Stacked Bars
- Mittelwert + SD Overlay
- Schiefe/Kurtosis Warnung
- Vergleich Subgruppen
```

#### 3.4 Reliabilitaets-Simulator
```
Komponente: ReliabilitySimulator
Features:
- "Was waere wenn" - Item entfernen
- Alpha-Aenderung vorhersagen
- Optimale Item-Auswahl vorschlagen
- Kurzskala generieren
```

---

## Technische Umsetzung

### Empfohlene Libraries

| Library | Verwendung | Vorteile |
|---------|-----------|----------|
| **Recharts** | Balken, Linien, Radar, Pie | Bereits im Projekt, React-nativ |
| **nivo** | Heatmaps, Treemaps, Sankey | Schoene Optik, gute Doku |
| **vis-network** | Netzwerk-Graphen | Sehr interaktiv, performant |
| **D3.js** | Custom Visualisierungen | Maximale Flexibilitaet |
| **simple-statistics** | Psychometrie-Berechnungen | Lightweight, kein Backend noetig |

### Architektur

```
src/
  components/
    visualization/
      charts/
        CodeFrequencyChart.tsx
        CodeDistributionHeatmap.tsx
        CoOccurrenceMatrix.tsx
        CodeTrendsTimeline.tsx
        PersonaRadarChart.tsx
      network/
        CategoryNetworkGraph.tsx
        CodeRelationsNetwork.tsx
      psychometrics/
        PsychometricsDashboard.tsx
        FactorAnalysisView.tsx
        ResponseDistribution.tsx
        ReliabilitySimulator.tsx
      shared/
        ChartContainer.tsx      # Wrapper mit Export
        ChartLegend.tsx
        ChartTooltip.tsx
        ExportButtons.tsx       # PNG/SVG/PDF

  services/
    statistics/
      descriptive.ts           # Mittelwert, SD, etc.
      correlation.ts           # Pearson, Spearman
      reliability.ts           # Cronbach, Split-Half
      factorAnalysis.ts        # PCA, EFA
      itemAnalysis.ts          # Trennschaerfe, Schwierigkeit
```

### Datenfluss

```
[Projekt-Daten]
      |
      v
[useVisualizationData Hook]
      |
      +---> aggregateCodeFrequencies()
      +---> calculateCoOccurrence()
      +---> computePsychometrics()
      |
      v
[Visualization Components]
      |
      v
[Export: PNG/SVG/PDF/CSV]
```

---

## Priorisierte Roadmap

### Sprint 1 (Diese Woche)
- [ ] `CodeFrequencyChart` implementieren
- [ ] `CoOccurrenceMatrix` als Heatmap
- [ ] Integration in Projekt-Analyse-Tab

### Sprint 2 (Naechste Woche)
- [ ] `CategoryNetworkGraph` mit vis-network
- [ ] `CodeDistributionHeatmap`
- [ ] Export-Buttons (PNG/SVG)

### Sprint 3 (Woche 3)
- [ ] `PsychometricsDashboard` Grundgeruest
- [ ] Cronbach's Alpha Berechnung
- [ ] Item-Analyse-Tabelle

### Sprint 4 (Woche 4)
- [ ] `ResponseDistribution` Charts
- [ ] `ReliabilitySimulator`
- [ ] Faktorenanalyse (Scree Plot + Ladungen)

### Sprint 5 (Woche 5)
- [ ] `PersonaRadarChart`
- [ ] `CodeTrendsTimeline`
- [ ] Gesamt-Integration & Polish

---

## Wettbewerbsvorteil nach Implementation

| Feature | MAXQDA | ATLAS.ti | NVivo | EVIDENRA |
|---------|--------|----------|-------|----------|
| Code-Haeufigkeit | ✓ | ✓ | ✓ | ✓ |
| Co-Occurrence | ✓ | ✓ | ✓ | ✓ |
| Netzwerk-Graphen | ✓ | ✓✓ | ✓ | ✓✓ (AKIH) |
| Trends/Timeline | ✓✓ | ✓ | ✓ | ✓ |
| Psychometrie | - | - | (XLSTAT) | ✓✓✓ |
| Faktorenanalyse | - | - | ✓ (PCA) | ✓✓ |
| Item-Analyse | - | - | - | ✓✓✓ |
| Skalen-Validierung | - | - | - | ✓✓✓ |
| Survey Export | - | - | - | ✓✓✓ |
| Preis | $$$ | $$$ | $$$$ | $ |

**EVIDENRA wird das EINZIGE Tool sein, das qualitative Analyse UND Fragebogen-Entwicklung mit voller Psychometrie in EINER App vereint!**

---

## Quellen

- [MAXQDA 2024 Features](https://www.maxqda.com/new-maxqda-24)
- [MAXQDA 2025 Update](https://www.maxqda.com/blogpost/maxqda-2025-nov)
- [ATLAS.ti Spring 2024 Release](https://atlasti.com/spring-release-2024)
- [ATLAS.ti Features](https://atlasti.com/features)
- [NVivo 15.3 Release](https://lumivero.com/resources/blog/nvivo-15-3-release/)
- [NVivo Visualization Guide](https://lumivero.com/resources/blog/harnessing-data-visualization-for-qualitative-research-with-nvivo/)
- [Cronbach's Alpha Explained](https://statisticsbyjim.com/basics/cronbachs-alpha/)
