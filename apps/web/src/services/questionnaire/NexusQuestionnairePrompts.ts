/**
 * Nexus Questionnaire Prompt Generator
 * EVIDENRA Research - AI-Assisted Questionnaire Development
 *
 * This module generates specialized prompts for Nexus to act as a
 * questionnaire development expert. Nexus can:
 * 1. Search for validated scales (Level 1: Adapter)
 * 2. Validate and analyze questionnaires (Level 2: Validator)
 * 3. Generate new items from qualitative data (Level 3: Creator)
 */

import { Code, Coding } from '@/types'
import {
  Scale,
  ConstructDefinition,
  ValidationStudyPlan,
  ReliabilityResult,
} from './types'

import {
  SCALE_REPOSITORIES,
  NEXUS_QUESTIONNAIRE_PROMPTS,
  RELIABILITY_THRESHOLDS,
  VALIDITY_THRESHOLDS,
  ITEM_WRITING_RULES,
  ADAPTATION_GUIDELINES,
} from './knowledge'

// ============================================================================
// SYSTEM PROMPT FOR QUESTIONNAIRE EXPERTISE
// ============================================================================

export const QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT = `
Du bist NEXUS, ein KI-Experte für wissenschaftliche Fragebogenentwicklung.
Du hast tiefgreifendes Wissen über:

## Psychometrie
- Item Response Theory (IRT): 1-PL, 2-PL, Graded Response Model
- Reliabilität: Cronbach's α (≥0.70 akzeptabel, ≥0.80 gut), McDonald's ω
- Validität: Konstrukt-, Kriteriums-, Inhaltsvalidität
- Faktorenanalyse: EFA (explorativ), CFA (konfirmatorisch)

## Item-Writing
- KEINE Double-Barreled Items (zwei Fragen in einer)
- KEINE Leading Questions (suggestive Formulierungen)
- KEINE Double-Negatives
- Erste Person Singular ("Ich...")
- 8-15 Wörter pro Item
- Mix aus positiv/negativ formulierten Items

## Validierte Skalen-Repositories
${Object.entries(SCALE_REPOSITORIES)
  .map(([key, repo]) => `- ${repo.name}: ${repo.url}`)
  .join('\n')}

## COSMIN Standards
Alle Fragebogen-Empfehlungen folgen den COSMIN-Richtlinien für:
- Inhaltsvalidität (I-CVI ≥ 0.78)
- Strukturelle Validität (CFI/TLI ≥ 0.95)
- Interne Konsistenz (α ≥ 0.70)

## Dein Verhalten
1. PRIORISIERE validierte Skalen vor Neuentwicklung
2. Dokumentiere IMMER den wissenschaftlichen Hintergrund
3. Warene vor methodischen Problemen
4. Schlage Web-Suche vor, wenn Konstrukt unbekannt
5. Generiere Items NUR basierend auf qualitativen Daten, nie aus dem Nichts
`

// ============================================================================
// PROMPT GENERATORS
// ============================================================================

export class NexusQuestionnairePrompts {
  /**
   * Generate prompt for extracting constructs from qualitative codes
   */
  static generateConstructExtractionPrompt(
    codes: { name: string; description?: string; segmentCount: number }[],
    segments: { text: string; codeName: string }[]
  ): string {
    const codeList = codes
      .map(c => `- ${c.name} (${c.segmentCount} Segmente)${c.description ? `: ${c.description}` : ''}`)
      .join('\n')

    const segmentSamples = segments
      .slice(0, 20) // Limit to 20 samples
      .map(s => `[${s.codeName}]: "${s.text}"`)
      .join('\n')

    return `
${QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT}

## AUFGABE: Konstrukt-Extraktion

Analysiere die folgenden qualitativen Codes und identifiziere das/die zugrundeliegende(n) Konstrukt(e).

### CODES:
${codeList}

### BEISPIEL-SEGMENTE:
${segmentSamples}

### ANALYSE-SCHRITTE:
1. Identifiziere das Hauptkonstrukt (z.B. "Arbeitszufriedenheit")
2. Bestimme Dimensionen/Facetten basierend auf den Codes
3. Definiere jede Dimension operationalisierbar
4. Prüfe, ob validierte Skalen existieren (Web-Suche empfohlen)

### OUTPUT-FORMAT:
\`\`\`json
{
  "konstrukt": {
    "name": "...",
    "definition": "...",
    "dimensionen": [
      {
        "name": "...",
        "definition": "...",
        "indikatoren": ["..."],
        "basierendAufCodes": ["..."]
      }
    ]
  },
  "existierendeSkalen": [
    {
      "name": "...",
      "quelle": "ZIS/GESIS/etc.",
      "passung": "hoch/mittel/gering",
      "grund": "..."
    }
  ],
  "empfehlung": "adaption|neuentwicklung",
  "begruendung": "..."
}
\`\`\`
`
  }

  /**
   * Generate prompt for searching validated scales
   */
  static generateScaleSearchPrompt(
    construct: string,
    context: string,
    language: 'de' | 'en' = 'de'
  ): string {
    return `
${QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT}

## AUFGABE: Validierte Skalen suchen

Suche nach validierten Messinstrumenten für das Konstrukt: "${construct}"

### KONTEXT:
${context}

### SPRACHE: ${language === 'de' ? 'Deutsch' : 'English'}

### SUCHSTRATEGIE:
1. Durchsuche ZIS/GESIS (https://zis.gesis.org)
2. Prüfe PROMIS (https://www.healthmeasures.net)
3. Falls klinisch: Psychology Tools
4. Falls Bildung: PISA/TIMSS Instrumente
5. Web-Suche für aktuelle Publikationen

### OUTPUT-FORMAT:
\`\`\`json
{
  "gefundeneSkalen": [
    {
      "name": "...",
      "autoren": ["..."],
      "jahr": 0000,
      "quelle": "...",
      "doi": "...",
      "sprachen": ["de", "en"],
      "itemAnzahl": 0,
      "dimensionen": ["..."],
      "cronbachAlpha": 0.00,
      "stichprobe": "...",
      "passungZumKontext": "hoch/mittel/gering",
      "passungBegruendung": "..."
    }
  ],
  "empfehlung": {
    "skala": "...",
    "grund": "...",
    "adaptionNoetig": true/false,
    "adaptionSchritte": ["..."]
  },
  "fallsKeinePasst": {
    "neuentwicklungNoetig": true/false,
    "grund": "..."
  }
}
\`\`\`

### WICHTIG:
- Bevorzuge Skalen mit psychometrischen Daten
- Prüfe, ob deutsche Version existiert
- Beachte Lizenz/Copyright
`
  }

  /**
   * Generate prompt for creating new items from qualitative data
   */
  static generateItemCreationPrompt(
    constructDefinition: ConstructDefinition,
    targetItemCount: number,
    responseFormat: 'likert5' | 'likert7' = 'likert5'
  ): string {
    const dimensionList = constructDefinition.dimensions
      .map(d => `
### Dimension: ${d.name}
Definition: ${d.definition}
Indikatoren: ${d.indicators.join(', ')}
Basierend auf ${d.segmentCount} qualitativen Segmenten
`)
      .join('\n')

    const segmentExamples = constructDefinition.sourceSegments
      .slice(0, 15)
      .map(s => `- [${s.codeName}]: "${s.text}"`)
      .join('\n')

    return `
${QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT}

## AUFGABE: Item-Generierung

Erstelle wissenschaftlich fundierte Items für das Konstrukt "${constructDefinition.name}".

### KONSTRUKT-DEFINITION:
${constructDefinition.definition}

### DIMENSIONEN:
${dimensionList}

### QUALITATIVE GRUNDLAGE:
${segmentExamples}

### ANFORDERUNGEN:
- Anzahl Items: ${targetItemCount}
- Response-Format: ${responseFormat === 'likert5' ? '5-Punkt Likert (Stimme überhaupt nicht zu → Stimme voll zu)' : '7-Punkt Likert'}
- Verteilung: ~80% positiv, ~20% negativ formuliert
- Pro Dimension mindestens 3 Items

### ITEM-REGELN (STRENG EINHALTEN):
1. KEINE Double-Barreled: Nur EIN Konzept pro Item
2. KEINE Leading: Neutral formulieren
3. Erste Person: "Ich..."
4. Länge: 8-15 Wörter
5. Einfache Sprache: Keine Fachbegriffe
6. Reverse Items: Echte Gegensätze, keine Verneinungen

### OUTPUT-FORMAT:
\`\`\`json
{
  "items": [
    {
      "id": "item_01",
      "text": "...",
      "dimension": "...",
      "formulierung": "positiv|negativ",
      "basierendAuf": "Segment-ID oder qualitative Beobachtung",
      "qualitaetsPruefung": {
        "doubleBarreled": false,
        "leading": false,
        "wortanzahl": 0
      }
    }
  ],
  "verteilung": {
    "proDimension": { "Dimension1": 0, "..." : 0 },
    "positivNegativ": { "positiv": 0, "negativ": 0 }
  },
  "hinweise": ["..."]
}
\`\`\`
`
  }

  /**
   * Generate prompt for item quality review
   */
  static generateItemReviewPrompt(items: string[]): string {
    const itemList = items
      .map((item, i) => `${i + 1}. "${item}"`)
      .join('\n')

    return `
${QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT}

## AUFGABE: Item-Qualitätsprüfung

Prüfe die folgenden Items auf wissenschaftliche Qualität.

### ITEMS:
${itemList}

### PRÜFKRITERIEN:
${Object.entries(ITEM_WRITING_RULES.avoid)
  .map(([key, rule]) => `- ${rule.description}`)
  .join('\n')}

### FÜR JEDES ITEM PRÜFEN:
1. Double-Barreled? (Indikatoren: "und", "oder", "sowie")
2. Leading? (Indikatoren: "natürlich", "offensichtlich", etc.)
3. Double-Negative?
4. Zu lang/kurz? (Optimal: 8-15 Wörter)
5. Absolute Begriffe? ("immer", "nie", "alle")
6. Hypothetisch?
7. Fachbegriffe?

### OUTPUT-FORMAT:
\`\`\`json
{
  "itemAnalysen": [
    {
      "itemNummer": 1,
      "originalText": "...",
      "probleme": [
        {
          "typ": "double-barreled|leading|...",
          "schweregrad": "error|warning|info",
          "beschreibung": "..."
        }
      ],
      "score": 0-100,
      "verbesserungsvorschlag": "...",
      "akzeptiert": true/false
    }
  ],
  "zusammenfassung": {
    "akzeptiert": 0,
    "ueberarbeiten": 0,
    "ablehnen": 0
  },
  "globaleFeedback": ["..."]
}
\`\`\`
`
  }

  /**
   * Generate prompt for validation study planning
   */
  static generateValidationPlanPrompt(
    scaleName: string,
    itemCount: number,
    dimensionCount: number,
    targetPopulation: string
  ): string {
    return `
${QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT}

## AUFGABE: Validierungsstudie planen

Erstelle einen wissenschaftlichen Validierungsplan für die Skala "${scaleName}".

### SKALA-DETAILS:
- Items: ${itemCount}
- Dimensionen: ${dimensionCount}
- Zielgruppe: ${targetPopulation}

### VALIDIERUNGSPHASEN:

1. **Content Validity**
   - Expertenanzahl: 5-10
   - I-CVI Schwelle: ≥ ${VALIDITY_THRESHOLDS.content.iCVI}
   - S-CVI Schwelle: ≥ ${VALIDITY_THRESHOLDS.content.sCVIAve}

2. **Cognitive Interviews**
   - Teilnehmer: 5-10
   - Methode: Think-Aloud + Verbal Probing

3. **Pilot Study**
   - Stichprobe: mind. ${Math.max(50, itemCount * 3)}
   - Cronbach's α Schwelle: ≥ ${RELIABILITY_THRESHOLDS.cronbachAlpha.acceptable}
   - Item-Total r Schwelle: ≥ ${RELIABILITY_THRESHOLDS.itemTotalCorrelation.acceptable}

4. **Exploratory Factor Analysis**
   - Stichprobe: mind. ${Math.max(300, itemCount * 10)}
   - Methode: Parallel Analysis + Scree Plot
   - Rotation: Oblimin (für korrelierte Faktoren)

5. **Confirmatory Factor Analysis**
   - Stichprobe: mind. ${Math.max(300, itemCount * 10)} (NEUE Stichprobe)
   - Model Fit: CFI/TLI ≥ 0.95, RMSEA ≤ 0.06, SRMR ≤ 0.08
   - AVE: > 0.50, CR: > 0.70

### OUTPUT-FORMAT:
\`\`\`json
{
  "validierungsplan": {
    "phasen": [...],
    "gesamtStichprobe": 0,
    "geschaetzteDauer": "X Monate",
    "kritischeErfolgsfaktoren": ["..."]
  },
  "risikoanalyse": [
    {
      "risiko": "...",
      "wahrscheinlichkeit": "hoch/mittel/gering",
      "gegenmassnahme": "..."
    }
  ],
  "ressourcenPlan": {
    "software": ["R mit lavaan/psych", "SPSS", "..."],
    "expertise": ["Psychometrie", "Statistik", "..."]
  }
}
\`\`\`
`
  }

  /**
   * Generate prompt for interpreting psychometric results
   */
  static generateResultsInterpretationPrompt(
    reliability: ReliabilityResult,
    modelFit?: { cfi: number; tli: number; rmsea: number; srmr: number }
  ): string {
    const reliabilityJson = JSON.stringify(reliability, null, 2)
    const modelFitJson = modelFit ? JSON.stringify(modelFit, null, 2) : 'Nicht verfügbar'

    return `
${QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT}

## AUFGABE: Ergebnisinterpretation

Interpretiere die folgenden psychometrischen Ergebnisse und gib Empfehlungen.

### RELIABILITÄTSERGEBNISSE:
\`\`\`json
${reliabilityJson}
\`\`\`

### MODEL FIT (CFA):
\`\`\`json
${modelFitJson}
\`\`\`

### SCHWELLENWERTE ZUR ORIENTIERUNG:
- Cronbach's α: ${RELIABILITY_THRESHOLDS.cronbachAlpha.acceptable} (akzeptabel), ${RELIABILITY_THRESHOLDS.cronbachAlpha.good} (gut)
- Item-Total r: ≥ ${RELIABILITY_THRESHOLDS.itemTotalCorrelation.acceptable}
- CFI/TLI: ≥ 0.95 (exzellent), ≥ 0.90 (akzeptabel)
- RMSEA: ≤ 0.06 (exzellent), ≤ 0.08 (akzeptabel)

### OUTPUT-FORMAT:
\`\`\`json
{
  "reliabilitaet": {
    "bewertung": "exzellent|gut|akzeptabel|fragwuerdig|schlecht",
    "interpretation": "...",
    "problematischeItems": ["..."],
    "empfehlungen": ["..."]
  },
  "modelFit": {
    "bewertung": "...",
    "interpretation": "...",
    "modifikationsvorschlaege": ["..."]
  },
  "gesamtbewertung": {
    "skalaNutzbar": true/false,
    "einschraenkungen": ["..."],
    "naechsteSchritte": ["..."]
  }
}
\`\`\`
`
  }

  /**
   * Generate prompt for methods section writing
   */
  static generateMethodsSectionPrompt(
    scale: Scale,
    validationResults: {
      sampleSize: number
      demographics: string
      reliability: ReliabilityResult
      factorAnalysis?: { type: 'efa' | 'cfa'; factorCount: number }
    },
    language: 'de' | 'en' = 'de'
  ): string {
    return `
${QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT}

## AUFGABE: Methodenteil schreiben

Verfasse einen wissenschaftlichen Methodenteil für die Skalenvalidierung.

### SPRACHE: ${language === 'de' ? 'Deutsch' : 'English'}
### STIL: APA 7th Edition

### SKALA:
- Name: ${scale.name}
- Items: ${scale.items?.length || 0}
- Dimensionen: ${scale.dimensions?.length || 1}
- Response-Format: ${scale.responseFormat.type} (${scale.responseFormat.points} Punkte)

### VALIDIERUNGSERGEBNISSE:
- Stichprobe: n = ${validationResults.sampleSize}
- Demografie: ${validationResults.demographics}
- Cronbach's α: ${validationResults.reliability.cronbachAlpha.toFixed(2)}
${validationResults.factorAnalysis
  ? `- Faktorenanalyse: ${validationResults.factorAnalysis.type.toUpperCase()}, ${validationResults.factorAnalysis.factorCount} Faktor(en)`
  : ''}

### GEWÜNSCHTE ABSCHNITTE:
1. Instrument (Skala-Beschreibung)
2. Stichprobe und Datenerhebung
3. Analysestrategie
4. Ergebnisse der Validierung

### OUTPUT:
Wissenschaftlicher Fließtext, ca. 500-800 Wörter, mit korrekten Statistik-Angaben.
`
  }
}

export default NexusQuestionnairePrompts
