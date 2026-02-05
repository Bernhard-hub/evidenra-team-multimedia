/**
 * Nexus Questionnaire Integration
 * EVIDENRA Research - AI-Assisted Questionnaire Development
 *
 * Integrates the questionnaire module with the Nexus AI assistant.
 * Provides:
 * - System prompt extensions for questionnaire expertise
 * - Quick actions for questionnaire tasks
 * - Context builders for current questionnaire state
 * - Response handlers for questionnaire operations
 */

import {
  Scale,
  ConstructDefinition,
  ItemQualityReport,
  ReliabilityResult,
  ValidationStudyPlan,
} from './types'

import {
  QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT,
  NexusQuestionnairePrompts,
} from './NexusQuestionnairePrompts'

import { ZISRepository, ZISSearchResult } from './repositories/ZISRepository'
import { QuestionnaireService, ItemQualityAnalyzer } from './QuestionnaireService'
import { NexusItemGenerator, QualitativeCode, QualitativeSegment } from './NexusItemGenerator'
import { PsychometricEngine } from './PsychometricEngine'
import { ValidationWorkflowManager } from './ValidationWorkflow'
import { SurveyExporter } from './SurveyExporter'

// ============================================================================
// TYPES
// ============================================================================

export interface NexusQuestionnaireContext {
  // Current questionnaire development state
  activeScale?: Scale
  constructDefinition?: ConstructDefinition
  validationPhase?: 'planning' | 'content-validity' | 'pilot' | 'full-validation'

  // Available data from project
  qualitativeCodes: QualitativeCode[]
  qualitativeSegments: QualitativeSegment[]

  // Generated items if any
  generatedItems?: {
    id: string
    text: string
    dimension: string
    quality: ItemQualityReport
  }[]

  // Validation results if any
  reliabilityResults?: ReliabilityResult
}

export interface NexusQuestionnaireAction {
  id: string
  icon: string
  label: {
    de: string
    en: string
  }
  description: {
    de: string
    en: string
  }
  prompt: {
    de: string
    en: string
  }
  category: 'search' | 'generate' | 'validate' | 'export'
  requiresContext?: ('codes' | 'scale' | 'data')[]
}

export interface NexusQuestionnaireResponse {
  type: 'text' | 'scale-recommendation' | 'generated-items' | 'validation-plan' | 'export'
  content: string
  data?: {
    recommendedScales?: ZISSearchResult[]
    generatedItems?: any[]
    validationPlan?: ValidationStudyPlan
    exportFiles?: { format: string; filename: string }[]
  }
  suggestedActions?: string[]
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

export const NEXUS_QUESTIONNAIRE_ACTIONS: NexusQuestionnaireAction[] = [
  // SEARCH CATEGORY
  {
    id: 'search-validated-scale',
    icon: 'IconSearch',
    label: {
      de: 'Validierte Skala suchen',
      en: 'Search validated scale',
    },
    description: {
      de: 'Finde eine existierende validierte Skala für dein Konstrukt',
      en: 'Find an existing validated scale for your construct',
    },
    prompt: {
      de: `Analysiere meine qualitativen Codes und Kodierungen. Welches Konstrukt messe ich hier?
Suche in der ZIS/GESIS Datenbank nach validierten Skalen die dazu passen.
Für jede empfohlene Skala nenne: Name, Autoren, Cronbach's Alpha, Itemanzahl, und Link.
Wenn keine passt, erkläre warum und schlage Alternativen vor.`,
      en: `Analyze my qualitative codes and codings. What construct am I measuring here?
Search the ZIS/GESIS database for validated scales that fit.
For each recommended scale, provide: Name, authors, Cronbach's alpha, item count, and link.
If none fits, explain why and suggest alternatives.`,
    },
    category: 'search',
    requiresContext: ['codes'],
  },
  {
    id: 'find-scale-for-construct',
    icon: 'IconFileSearch',
    label: {
      de: 'Skala für Konstrukt',
      en: 'Scale for construct',
    },
    description: {
      de: 'Suche Skalen für ein spezifisches Konstrukt',
      en: 'Search scales for a specific construct',
    },
    prompt: {
      de: `Ich suche eine validierte Skala. Bitte frag mich nach dem Konstrukt das ich messen möchte, dann durchsuche ich die verfügbaren Repositories (ZIS/GESIS, PROMIS, etc.) und gebe dir eine Empfehlung mit psychometrischen Daten.`,
      en: `I'm looking for a validated scale. Please ask me about the construct I want to measure, then I'll search available repositories (ZIS/GESIS, PROMIS, etc.) and give you a recommendation with psychometric data.`,
    },
    category: 'search',
  },

  // GENERATE CATEGORY
  {
    id: 'extract-construct',
    icon: 'IconBulb',
    label: {
      de: 'Konstrukt extrahieren',
      en: 'Extract construct',
    },
    description: {
      de: 'Extrahiere das Konstrukt aus deinen qualitativen Daten',
      en: 'Extract the construct from your qualitative data',
    },
    prompt: {
      de: `Analysiere meine qualitativen Codes und die zugehörigen Textsegmente.
Identifiziere:
1. Das Hauptkonstrukt das hier gemessen wird
2. Die Dimensionen/Facetten des Konstrukts
3. Indikatoren für jede Dimension basierend auf den Daten
4. Verwandte Konstrukte in der Literatur

Erstelle eine wissenschaftliche Konstruktdefinition die als Grundlage für eine Fragebogenentwicklung dienen kann.`,
      en: `Analyze my qualitative codes and associated text segments.
Identify:
1. The main construct being measured
2. The dimensions/facets of the construct
3. Indicators for each dimension based on the data
4. Related constructs in the literature

Create a scientific construct definition that can serve as a foundation for questionnaire development.`,
    },
    category: 'generate',
    requiresContext: ['codes'],
  },
  {
    id: 'generate-items',
    icon: 'IconListCheck',
    label: {
      de: 'Items generieren',
      en: 'Generate items',
    },
    description: {
      de: 'Generiere Fragebogen-Items aus qualitativen Daten',
      en: 'Generate questionnaire items from qualitative data',
    },
    prompt: {
      de: `Basierend auf meinen qualitativen Codes und Textsegmenten, generiere wissenschaftlich fundierte Fragebogen-Items.

Regeln die du einhalten MUSST:
- Jedes Item misst NUR EIN Konzept (keine Double-Barreled)
- Keine führenden Formulierungen
- Erste Person Singular ("Ich...")
- 8-15 Wörter pro Item
- Mix aus positiv und negativ formulierten Items (80/20)

Für jedes Item:
1. Itemtext
2. Welche Dimension es misst
3. Auf welchem Textsegment es basiert
4. Qualitätsprüfung (Double-Barreled, Leading, etc.)`,
      en: `Based on my qualitative codes and text segments, generate scientifically sound questionnaire items.

Rules you MUST follow:
- Each item measures ONLY ONE concept (no double-barreled)
- No leading formulations
- First person singular ("I...")
- 8-15 words per item
- Mix of positively and negatively worded items (80/20)

For each item:
1. Item text
2. Which dimension it measures
3. Which text segment it's based on
4. Quality check (double-barreled, leading, etc.)`,
    },
    category: 'generate',
    requiresContext: ['codes'],
  },
  {
    id: 'check-item-quality',
    icon: 'IconChecks',
    label: {
      de: 'Item-Qualität prüfen',
      en: 'Check item quality',
    },
    description: {
      de: 'Prüfe Items auf wissenschaftliche Qualität',
      en: 'Check items for scientific quality',
    },
    prompt: {
      de: `Prüfe die folgenden Fragebogen-Items auf wissenschaftliche Qualität.

Checkliste für jedes Item:
□ Double-Barreled? (fragt nach zwei Dingen)
□ Leading? (suggeriert Antwort)
□ Double-Negative?
□ Zu lang (>20 Wörter)?
□ Zu kurz (<5 Wörter)?
□ Fachbegriffe/Jargon?
□ Hypothetisch?
□ Absolute Begriffe (immer, nie)?

Gib für jedes problematische Item einen Verbesserungsvorschlag.

Bitte gib mir die Items die du prüfen sollst, oder ich prüfe die generierten Items aus unserem Projekt.`,
      en: `Check the following questionnaire items for scientific quality.

Checklist for each item:
□ Double-barreled? (asks about two things)
□ Leading? (suggests answer)
□ Double-negative?
□ Too long (>20 words)?
□ Too short (<5 words)?
□ Jargon?
□ Hypothetical?
□ Absolute terms (always, never)?

Provide improvement suggestions for each problematic item.

Please give me the items to check, or I'll check the generated items from our project.`,
    },
    category: 'generate',
  },

  // VALIDATE CATEGORY
  {
    id: 'create-validation-plan',
    icon: 'IconClipboardList',
    label: {
      de: 'Validierungsplan erstellen',
      en: 'Create validation plan',
    },
    description: {
      de: 'Plane die wissenschaftliche Validierung deiner Skala',
      en: 'Plan the scientific validation of your scale',
    },
    prompt: {
      de: `Erstelle einen wissenschaftlichen Validierungsplan für meine Skala basierend auf den COSMIN-Richtlinien.

Der Plan sollte enthalten:
1. **Content Validity** - Expertenanzahl, I-CVI Schwellen
2. **Cognitive Interviews** - Teilnehmerzahl, Methodik
3. **Pilot Study** - Stichprobengröße, Analysen, Schwellenwerte
4. **Full Validation** - EFA/CFA, AVE, HTMT Kriterien

Für jede Phase: benötigte Stichprobe, Analysemethoden, Erfolgskriterien.

Wie viele Items hat meine Skala? (Falls nicht bekannt, frag nach)`,
      en: `Create a scientific validation plan for my scale based on COSMIN guidelines.

The plan should include:
1. **Content Validity** - Expert count, I-CVI thresholds
2. **Cognitive Interviews** - Participant count, methodology
3. **Pilot Study** - Sample size, analyses, thresholds
4. **Full Validation** - EFA/CFA, AVE, HTMT criteria

For each phase: required sample, analysis methods, success criteria.

How many items does my scale have? (If unknown, ask)`,
    },
    category: 'validate',
    requiresContext: ['scale'],
  },
  {
    id: 'analyze-reliability',
    icon: 'IconChartBar',
    label: {
      de: 'Reliabilität analysieren',
      en: 'Analyze reliability',
    },
    description: {
      de: 'Berechne und interpretiere Reliabilitätskennwerte',
      en: 'Calculate and interpret reliability metrics',
    },
    prompt: {
      de: `Hilf mir bei der Reliabilitätsanalyse meiner Skala.

Ich kann berechnen:
- Cronbach's Alpha
- McDonald's Omega
- Split-Half Reliabilität
- Item-Total Korrelationen
- Alpha-wenn-Item-gelöscht

Schwellenwerte:
- α ≥ 0.90: Exzellent
- α ≥ 0.80: Gut
- α ≥ 0.70: Akzeptabel
- Item-Total r ≥ 0.30: Akzeptabel

Hast du bereits Daten? Wenn ja, beschreibe sie (Stichprobengröße, Itemanzahl) und ich helfe bei der Interpretation.`,
      en: `Help me with reliability analysis of my scale.

I can calculate:
- Cronbach's Alpha
- McDonald's Omega
- Split-half reliability
- Item-total correlations
- Alpha-if-item-deleted

Thresholds:
- α ≥ 0.90: Excellent
- α ≥ 0.80: Good
- α ≥ 0.70: Acceptable
- Item-total r ≥ 0.30: Acceptable

Do you have data? If yes, describe it (sample size, item count) and I'll help interpret.`,
    },
    category: 'validate',
  },
  {
    id: 'interpret-factor-analysis',
    icon: 'IconNetwork',
    label: {
      de: 'Faktorenanalyse interpretieren',
      en: 'Interpret factor analysis',
    },
    description: {
      de: 'Hilfe bei EFA/CFA Interpretation',
      en: 'Help with EFA/CFA interpretation',
    },
    prompt: {
      de: `Hilf mir bei der Interpretation meiner Faktorenanalyse.

Ich brauche Hilfe mit:
- Optimale Faktorenzahl (Parallel Analysis, Kaiser-Kriterium)
- Faktorladungen interpretieren (≥0.40 auf Primärfaktor)
- Kreuzladungen bewerten (≤0.30)
- Model Fit verstehen (CFI, TLI, RMSEA, SRMR)

Schwellenwerte für guten Model Fit:
- CFI/TLI ≥ 0.95 (exzellent), ≥ 0.90 (akzeptabel)
- RMSEA ≤ 0.06 (exzellent), ≤ 0.08 (akzeptabel)
- SRMR ≤ 0.08

Teile mir deine Ergebnisse mit und ich helfe bei der Interpretation.`,
      en: `Help me interpret my factor analysis.

I need help with:
- Optimal factor count (Parallel Analysis, Kaiser criterion)
- Interpreting factor loadings (≥0.40 on primary factor)
- Evaluating cross-loadings (≤0.30)
- Understanding model fit (CFI, TLI, RMSEA, SRMR)

Thresholds for good model fit:
- CFI/TLI ≥ 0.95 (excellent), ≥ 0.90 (acceptable)
- RMSEA ≤ 0.06 (excellent), ≤ 0.08 (acceptable)
- SRMR ≤ 0.08

Share your results and I'll help interpret.`,
    },
    category: 'validate',
  },

  // EXPORT CATEGORY
  {
    id: 'export-survey',
    icon: 'IconDownload',
    label: {
      de: 'Survey exportieren',
      en: 'Export survey',
    },
    description: {
      de: 'Exportiere zu LimeSurvey, Qualtrics, REDCap',
      en: 'Export to LimeSurvey, Qualtrics, REDCap',
    },
    prompt: {
      de: `Ich kann deine Skala in verschiedene Formate exportieren:

**Verfügbare Formate:**
- **DDI-XML** - Internationaler Standard (Data Documentation Initiative)
- **LimeSurvey (.lss)** - Open-Source Survey-Plattform
- **Qualtrics (.qsf)** - Enterprise Survey-Plattform
- **REDCap** - Clinical Research Data Capture
- **CSV** - Einfaches Tabellenformat

Welches Format brauchst du? Beschreibe auch welche Skala exportiert werden soll.`,
      en: `I can export your scale to various formats:

**Available formats:**
- **DDI-XML** - International standard (Data Documentation Initiative)
- **LimeSurvey (.lss)** - Open-source survey platform
- **Qualtrics (.qsf)** - Enterprise survey platform
- **REDCap** - Clinical research data capture
- **CSV** - Simple table format

Which format do you need? Also describe which scale should be exported.`,
    },
    category: 'export',
    requiresContext: ['scale'],
  },
  {
    id: 'generate-methods-section',
    icon: 'IconFileText',
    label: {
      de: 'Methodenteil generieren',
      en: 'Generate methods section',
    },
    description: {
      de: 'Erstelle wissenschaftlichen Methodenteil für Paper',
      en: 'Create scientific methods section for paper',
    },
    prompt: {
      de: `Generiere einen wissenschaftlichen Methodenteil für meine Skalenvalidierung.

Der Text sollte enthalten (APA 7 Format):
1. **Instrument** - Beschreibung der Skala
2. **Adaption** - Falls adaptiert, den Prozess beschreiben
3. **Stichprobe** - Beschreibung der Validierungsstichprobe
4. **Analysestrategie** - Welche Analysen wurden durchgeführt
5. **Ergebnisse** - Reliabilität, Validität, Faktorstruktur

Welche Informationen hast du bereits? (Skalaname, Itemanzahl, Stichprobengröße, Cronbach's Alpha, etc.)`,
      en: `Generate a scientific methods section for my scale validation.

The text should include (APA 7 format):
1. **Instrument** - Description of the scale
2. **Adaptation** - If adapted, describe the process
3. **Sample** - Description of the validation sample
4. **Analysis strategy** - Which analyses were performed
5. **Results** - Reliability, validity, factor structure

What information do you have? (Scale name, item count, sample size, Cronbach's alpha, etc.)`,
    },
    category: 'export',
  },
]

// ============================================================================
// SYSTEM PROMPT EXTENSION
// ============================================================================

export function buildQuestionnaireSystemPrompt(
  context: NexusQuestionnaireContext,
  language: 'de' | 'en'
): string {
  const basePrompt = QUESTIONNAIRE_EXPERT_SYSTEM_PROMPT

  let contextSection = ''

  // Add qualitative codes context
  if (context.qualitativeCodes.length > 0) {
    contextSection += language === 'de'
      ? '\n\n## Verfügbare qualitative Codes:\n'
      : '\n\n## Available qualitative codes:\n'

    for (const code of context.qualitativeCodes.slice(0, 20)) {
      contextSection += `- ${code.name}${code.description ? `: ${code.description}` : ''}\n`
    }
  }

  // Add segments sample
  if (context.qualitativeSegments.length > 0) {
    contextSection += language === 'de'
      ? '\n\n## Beispiel-Kodierungen:\n'
      : '\n\n## Sample codings:\n'

    for (const segment of context.qualitativeSegments.slice(0, 10)) {
      contextSection += `- [${segment.codeName}]: "${segment.text.substring(0, 100)}..."\n`
    }
  }

  // Add active scale if any
  if (context.activeScale) {
    contextSection += language === 'de'
      ? `\n\n## Aktive Skala: ${context.activeScale.name}\n`
      : `\n\n## Active scale: ${context.activeScale.name}\n`

    contextSection += `- ${context.activeScale.items.length} Items\n`
    if (context.activeScale.dimensions) {
      contextSection += `- ${context.activeScale.dimensions.length} Dimensionen: ${context.activeScale.dimensions.map(d => d.name).join(', ')}\n`
    }
  }

  // Add validation phase
  if (context.validationPhase) {
    const phaseNames = {
      'planning': { de: 'Planung', en: 'Planning' },
      'content-validity': { de: 'Content-Validität', en: 'Content Validity' },
      'pilot': { de: 'Pilot-Studie', en: 'Pilot Study' },
      'full-validation': { de: 'Vollvalidierung', en: 'Full Validation' },
    }

    contextSection += language === 'de'
      ? `\n\n## Validierungsphase: ${phaseNames[context.validationPhase].de}\n`
      : `\n\n## Validation phase: ${phaseNames[context.validationPhase].en}\n`
  }

  return basePrompt + contextSection
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

export class NexusQuestionnaireContextBuilder {
  /**
   * Build questionnaire context from project data
   */
  static build(
    codes: { id: string; name: string; description?: string; parentId?: string }[],
    codings: { id: string; codeId: string; text: string; codeName?: string }[],
    activeScale?: Scale
  ): NexusQuestionnaireContext {
    // Convert to qualitative format
    const qualitativeCodes: QualitativeCode[] = codes.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      parentId: c.parentId,
    }))

    const qualitativeSegments: QualitativeSegment[] = codings.map(c => {
      const code = codes.find(code => code.id === c.codeId)
      return {
        id: c.id,
        text: c.text,
        codeId: c.codeId,
        codeName: c.codeName || code?.name || 'Unknown',
      }
    })

    return {
      qualitativeCodes,
      qualitativeSegments,
      activeScale,
    }
  }

  /**
   * Detect if questionnaire context should be activated
   */
  static shouldActivateQuestionnaireContext(userMessage: string): boolean {
    const keywords = [
      // German
      'fragebogen', 'skala', 'item', 'validierung', 'reliabilität',
      'cronbach', 'faktorenanalyse', 'efa', 'cfa', 'likert',
      'konstrukt', 'messinstrument', 'survey', 'umfrage',
      // English
      'questionnaire', 'scale', 'validation', 'reliability',
      'factor analysis', 'instrument', 'measure',
    ]

    const lowerMessage = userMessage.toLowerCase()
    return keywords.some(keyword => lowerMessage.includes(keyword))
  }
}

// ============================================================================
// ACTION HANDLER
// ============================================================================

export class NexusQuestionnaireActionHandler {
  /**
   * Handle questionnaire-related actions
   */
  static async handleAction(
    actionId: string,
    context: NexusQuestionnaireContext,
    additionalParams?: Record<string, any>
  ): Promise<NexusQuestionnaireResponse> {
    switch (actionId) {
      case 'search-validated-scale':
        return this.handleSearchScale(context)

      case 'extract-construct':
        return this.handleExtractConstruct(context)

      case 'generate-items':
        return this.handleGenerateItems(context, additionalParams)

      case 'create-validation-plan':
        return this.handleCreateValidationPlan(context)

      default:
        return {
          type: 'text',
          content: 'Unknown action',
        }
    }
  }

  private static handleSearchScale(context: NexusQuestionnaireContext): NexusQuestionnaireResponse {
    // Search for scales based on codes
    const results = ZISRepository.suggestFromCodes(context.qualitativeCodes)

    if (results.length === 0) {
      return {
        type: 'text',
        content: 'Keine passenden validierten Skalen gefunden. Empfehlung: Neuentwicklung basierend auf den qualitativen Daten.',
        suggestedActions: ['extract-construct', 'generate-items'],
      }
    }

    return {
      type: 'scale-recommendation',
      content: `${results.length} validierte Skalen gefunden`,
      data: {
        recommendedScales: results,
      },
      suggestedActions: ['check-item-quality', 'create-validation-plan'],
    }
  }

  private static handleExtractConstruct(context: NexusQuestionnaireContext): NexusQuestionnaireResponse {
    const result = NexusItemGenerator.ConstructExtractor.extract(
      context.qualitativeCodes,
      context.qualitativeSegments
    )

    return {
      type: 'text',
      content: `Konstrukt extrahiert: ${result.construct.name}\n\nDimensionen:\n${
        result.construct.dimensions.map(d => `- ${d.name}: ${d.definition}`).join('\n')
      }\n\nEmpfehlung: ${result.rationale}`,
      suggestedActions: result.recommendation === 'create-new'
        ? ['generate-items']
        : ['search-validated-scale'],
    }
  }

  private static async handleGenerateItems(
    context: NexusQuestionnaireContext,
    params?: Record<string, any>
  ): Promise<NexusQuestionnaireResponse> {
    const result = await NexusItemGenerator.generateQuestionnaire(
      context.qualitativeCodes,
      context.qualitativeSegments,
      {
        itemsPerDimension: params?.itemsPerDimension || 4,
        responseFormat: params?.responseFormat || 'likert5',
        language: params?.language || 'de',
      }
    )

    return {
      type: 'generated-items',
      content: result.recommendation,
      data: {
        generatedItems: result.generatedItems?.items,
      },
      suggestedActions: ['check-item-quality', 'create-validation-plan'],
    }
  }

  private static handleCreateValidationPlan(context: NexusQuestionnaireContext): NexusQuestionnaireResponse {
    if (!context.activeScale) {
      return {
        type: 'text',
        content: 'Keine aktive Skala gefunden. Bitte zuerst Items generieren.',
        suggestedActions: ['generate-items'],
      }
    }

    const plan = ValidationWorkflowManager.createValidationPlan(context.activeScale)

    return {
      type: 'validation-plan',
      content: `Validierungsplan erstellt für "${context.activeScale.name}"`,
      data: {
        validationPlan: plan,
      },
      suggestedActions: ['export-survey'],
    }
  }
}

// ============================================================================
// MAIN INTEGRATION SERVICE
// ============================================================================

export class NexusQuestionnaireIntegration {
  // Quick actions
  static getQuickActions(language: 'de' | 'en'): NexusQuestionnaireAction[] {
    return NEXUS_QUESTIONNAIRE_ACTIONS
  }

  // System prompt
  static buildSystemPrompt = buildQuestionnaireSystemPrompt

  // Context builder
  static buildContext = NexusQuestionnaireContextBuilder.build
  static shouldActivate = NexusQuestionnaireContextBuilder.shouldActivateQuestionnaireContext

  // Action handler
  static handleAction = NexusQuestionnaireActionHandler.handleAction

  /**
   * Get questionnaire-specific quick actions based on current context
   */
  static getContextualActions(
    context: NexusQuestionnaireContext,
    language: 'de' | 'en'
  ): NexusQuestionnaireAction[] {
    const actions: NexusQuestionnaireAction[] = []

    // If we have codes but no scale, suggest search/generate
    if (context.qualitativeCodes.length > 0 && !context.activeScale) {
      actions.push(
        NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'search-validated-scale')!,
        NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'extract-construct')!,
        NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'generate-items')!
      )
    }

    // If we have a scale, suggest validation/export
    if (context.activeScale) {
      actions.push(
        NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'check-item-quality')!,
        NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'create-validation-plan')!,
        NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'export-survey')!,
        NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'generate-methods-section')!
      )
    }

    // Always available
    actions.push(
      NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'find-scale-for-construct')!,
      NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'analyze-reliability')!,
      NEXUS_QUESTIONNAIRE_ACTIONS.find(a => a.id === 'interpret-factor-analysis')!
    )

    return actions.filter(Boolean)
  }
}

export default NexusQuestionnaireIntegration
