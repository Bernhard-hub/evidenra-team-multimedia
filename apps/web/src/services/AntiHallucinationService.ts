// AntiHallucinationService.ts
// Zentraler Service zur Verhinderung von AI-Halluzinationen
// Portiert von EVIDENRA Ultimate für Team Multimedia

export interface AntiHallucinationProjectData {
  documents?: Array<{
    id?: string
    name?: string
    content?: string
    wordCount?: number
  }>
  categories?: Array<{
    id?: string
    name: string
    description?: string
    codingCount?: number
  }>
  codings?: Array<{
    id?: string
    text?: string
    categoryId?: string
    codeId?: string
    category?: string
    categoryName?: string
    documentId?: string
  }>
  name?: string
  projectName?: string
  methodology?: string
  methodologyName?: string
  researchQuestion?: string
}

export interface AntiHallucinationConfig {
  language: 'de' | 'en'
  maxCategories?: number
  additionalForbiddenTerms?: string[]
  additionalCorrectExamples?: string[]
  serviceName?: string
  showInterviewWarning?: boolean
  enforceMethodologyConsistency?: boolean
}

export class AntiHallucinationService {

  static generateContext(
    projectData: AntiHallucinationProjectData,
    config: AntiHallucinationConfig
  ): string {
    const {
      language,
      maxCategories = 8,
      additionalForbiddenTerms = [],
      additionalCorrectExamples = [],
      showInterviewWarning = true,
      enforceMethodologyConsistency = true
    } = config

    const stats = this.extractProjectStatistics(projectData)
    const methodologyName = projectData.methodologyName ||
      this.getMethodologyDisplayName(projectData.methodology || 'qualitative-analysis', language)
    const categoryList = this.generateCategoryList(projectData, maxCategories)

    if (language === 'de') {
      return this.generateGermanContext(
        stats, methodologyName, categoryList,
        additionalForbiddenTerms, additionalCorrectExamples,
        showInterviewWarning, enforceMethodologyConsistency
      )
    } else {
      return this.generateEnglishContext(
        stats, methodologyName, categoryList,
        additionalForbiddenTerms, additionalCorrectExamples,
        showInterviewWarning, enforceMethodologyConsistency
      )
    }
  }

  static generateSystemPromptAddition(language: 'de' | 'en'): string {
    if (language === 'de') {
      return `
🚫 ABSOLUT VERBOTEN (HALLUZINATIONEN):
• NIEMALS Interviews erfinden, wenn keine durchgeführt wurden!
• NIEMALS Sample-Größen erfinden (z.B. "12 Expert:innen wurden befragt")
• NIEMALS Zahlen oder Statistiken erfinden - NUR echte Projektdaten verwenden!
• NIEMALS "MAXQDA", "Atlas.ti" oder andere Tools erwähnen - nur EVIDENRA!

✅ IMMER BEACHTEN:
• Nur die im Prompt genannten echten Projektdaten verwenden
• Bei Dokumentenanalyse: Nur von "Dokumenten" sprechen, nicht von "Interviews"
• Bei Unsicherheit lieber weglassen als erfinden`
    } else {
      return `
🚫 ABSOLUTELY FORBIDDEN (HALLUCINATIONS):
• NEVER invent interviews if none were conducted!
• NEVER invent sample sizes (e.g., "12 experts were interviewed")
• NEVER invent numbers or statistics - ONLY use real project data!
• NEVER mention "MAXQDA", "Atlas.ti" or other tools - only EVIDENRA!

✅ ALWAYS OBSERVE:
• Only use real project data mentioned in the prompt
• For document analysis: Only speak of "documents", not "interviews"
• When uncertain, omit rather than invent`
    }
  }

  static validateGeneratedText(
    text: string,
    projectData: AntiHallucinationProjectData,
    language: 'de' | 'en'
  ): { isValid: boolean; warnings: string[]; score: number } {
    const warnings: string[] = []
    let score = 100

    const stats = this.extractProjectStatistics(projectData)

    // Prüfe auf Interview-Halluzinationen
    const interviewPatterns = language === 'de'
      ? [/interview/gi, /befrag/gi, /gesprächspartner/gi, /\d+\s*(expert|teilnehmer|befragte)/gi]
      : [/interview/gi, /survey/gi, /respondent/gi, /\d+\s*(expert|participant|respondent)/gi]

    for (const pattern of interviewPatterns) {
      if (pattern.test(text)) {
        warnings.push(language === 'de'
          ? `⚠️ Mögliche Interview-Halluzination gefunden`
          : `⚠️ Possible interview hallucination detected`)
        score -= 15
      }
    }

    // Prüfe auf falsche Dokumentanzahl
    const docNumberMatch = text.match(/(\d+)\s*(dokument|document)/gi)
    if (docNumberMatch) {
      const mentionedCount = parseInt(docNumberMatch[0].match(/\d+/)?.[0] || '0')
      if (mentionedCount !== stats.docCount && mentionedCount > 0) {
        warnings.push(language === 'de'
          ? `⚠️ Dokumentanzahl stimmt nicht: ${mentionedCount} erwähnt, ${stats.docCount} tatsächlich`
          : `⚠️ Document count mismatch: ${mentionedCount} mentioned, ${stats.docCount} actual`)
        score -= 10
      }
    }

    // Prüfe auf verbotene Tool-Namen
    const forbiddenTools = /maxqda|atlas\.?ti|nvivo|dedoose/gi
    if (forbiddenTools.test(text)) {
      warnings.push(language === 'de'
        ? `⚠️ Verbotenes Tool erwähnt (nur EVIDENRA verwenden!)`
        : `⚠️ Forbidden tool mentioned (only use EVIDENRA!)`)
      score -= 15
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      score: Math.max(0, score)
    }
  }

  private static extractProjectStatistics(projectData: AntiHallucinationProjectData): {
    docCount: number
    catCount: number
    codingCount: number
    totalWords: number
  } {
    const docCount = projectData.documents?.length || 0
    const catCount = projectData.categories?.length || 0
    const codingCount = projectData.codings?.length || 0
    const totalWords = projectData.documents?.reduce(
      (sum, d) => sum + (d.wordCount || d.content?.split(/\s+/).length || 0), 0
    ) || 0

    return { docCount, catCount, codingCount, totalWords }
  }

  private static generateCategoryList(
    projectData: AntiHallucinationProjectData,
    maxCategories: number
  ): string {
    if (!projectData.categories || projectData.categories.length === 0) {
      return ''
    }

    return projectData.categories.slice(0, maxCategories).map(cat => {
      const codingCount = projectData.codings?.filter(c =>
        c.categoryId === cat.id ||
        c.codeId === cat.id ||
        c.category === cat.name ||
        c.categoryName === cat.name
      ).length || cat.codingCount || 0

      return `  - ${cat.name}: ${codingCount} Kodierungen`
    }).join('\n')
  }

  private static getMethodologyDisplayName(
    methodology: string,
    language: 'de' | 'en'
  ): string {
    const methodNames: Record<string, { de: string; en: string }> = {
      'grounded-theory': {
        de: 'Grounded Theory nach Strauss/Corbin',
        en: 'Grounded Theory (Strauss/Corbin)'
      },
      'content-analysis': {
        de: 'Qualitative Inhaltsanalyse nach Mayring',
        en: 'Qualitative Content Analysis (Mayring)'
      },
      'thematic-analysis': {
        de: 'Thematische Analyse nach Braun/Clarke',
        en: 'Thematic Analysis (Braun/Clarke)'
      },
      'phenomenology': {
        de: 'Phänomenologische Analyse',
        en: 'Phenomenological Analysis'
      },
      'narrative': {
        de: 'Narrative Analyse',
        en: 'Narrative Analysis'
      },
      'qualitative-analysis': {
        de: 'Qualitative Dokumentenanalyse',
        en: 'Qualitative Document Analysis'
      }
    }

    return methodNames[methodology]?.[language] || methodNames['qualitative-analysis'][language]
  }

  private static generateGermanContext(
    stats: { docCount: number; catCount: number; codingCount: number; totalWords: number },
    methodologyName: string,
    categoryList: string,
    additionalForbiddenTerms: string[],
    additionalCorrectExamples: string[],
    showInterviewWarning: boolean,
    enforceMethodologyConsistency: boolean
  ): string {
    const additionalForbidden = additionalForbiddenTerms.length > 0
      ? `\n${additionalForbiddenTerms.map(t => `❌ NIEMALS "${t}" verwenden`).join('\n')}`
      : ''

    const additionalCorrect = additionalCorrectExamples.length > 0
      ? `\n${additionalCorrectExamples.map(e => `✅ KORREKT: "${e}"`).join('\n')}`
      : ''

    const interviewWarning = showInterviewWarning
      ? `Diese Studie basiert auf einer DOKUMENTENANALYSE mit EVIDENRA.
Es wurden KEINE Interviews durchgeführt!

`
      : ''

    return `
================================================================================
🚨 ANTI-HALLUZINATIONS-KONTEXT - NUR DIESE ECHTEN DATEN VERWENDEN!
================================================================================

${interviewWarning}=== ECHTE PROJEKTDATEN (NICHT VERÄNDERN!) ===
Dokumente analysiert: ${stats.docCount}
Gesamtwörter: ${stats.totalWords.toLocaleString('de-DE')}
Kategorien entwickelt: ${stats.catCount}
Kodierungen vorgenommen: ${stats.codingCount.toLocaleString('de-DE')}
Methodik: ${methodologyName}

=== KATEGORIENSYSTEM ===
${categoryList || '(Kategorien verfügbar)'}

=== ABSOLUTE VERBOTE ===${showInterviewWarning ? `
❌ NIEMALS "Interviews" oder "Befragungen" erwähnen - es gab KEINE!
❌ NIEMALS Sample-Größen erfinden` : ''}${enforceMethodologyConsistency ? `
❌ NIEMALS andere Methodik behaupten als: ${methodologyName}` : ''}
❌ NIEMALS Zahlen erfinden - NUR die oben genannten echten Werte verwenden
❌ NIEMALS "MAXQDA", "Atlas.ti" erwähnen - nur EVIDENRA!${additionalForbidden}

✅ KORREKT: "Die Analyse der ${stats.docCount} Dokumente mit ${stats.codingCount.toLocaleString('de-DE')} Kodierungen zeigt..."
✅ KORREKT: "Im Rahmen der ${methodologyName} wurden ${stats.catCount} Kategorien entwickelt..."${additionalCorrect}

================================================================================
`
  }

  private static generateEnglishContext(
    stats: { docCount: number; catCount: number; codingCount: number; totalWords: number },
    methodologyName: string,
    categoryList: string,
    additionalForbiddenTerms: string[],
    additionalCorrectExamples: string[],
    showInterviewWarning: boolean,
    enforceMethodologyConsistency: boolean
  ): string {
    const additionalForbidden = additionalForbiddenTerms.length > 0
      ? `\n${additionalForbiddenTerms.map(t => `❌ NEVER use "${t}"`).join('\n')}`
      : ''

    const additionalCorrect = additionalCorrectExamples.length > 0
      ? `\n${additionalCorrectExamples.map(e => `✅ CORRECT: "${e}"`).join('\n')}`
      : ''

    const interviewWarning = showInterviewWarning
      ? `This study is based on DOCUMENT ANALYSIS using EVIDENRA.
NO interviews were conducted!

`
      : ''

    return `
================================================================================
🚨 ANTI-HALLUCINATION CONTEXT - USE ONLY THESE REAL DATA!
================================================================================

${interviewWarning}=== REAL PROJECT DATA (DO NOT CHANGE!) ===
Documents analyzed: ${stats.docCount}
Total words: ${stats.totalWords.toLocaleString('en-US')}
Categories developed: ${stats.catCount}
Codings performed: ${stats.codingCount.toLocaleString('en-US')}
Methodology: ${methodologyName}

=== CATEGORY SYSTEM ===
${categoryList || '(Categories available)'}

=== ABSOLUTE PROHIBITIONS ===${showInterviewWarning ? `
❌ NEVER mention "interviews" or "surveys" - there were NONE!
❌ NEVER invent sample sizes` : ''}${enforceMethodologyConsistency ? `
❌ NEVER claim different methodology than: ${methodologyName}` : ''}
❌ NEVER invent numbers - ONLY use the real values listed above
❌ NEVER mention "MAXQDA", "Atlas.ti" - only EVIDENRA!${additionalForbidden}

✅ CORRECT: "The analysis of ${stats.docCount} documents with ${stats.codingCount.toLocaleString('en-US')} codings shows..."
✅ CORRECT: "Using ${methodologyName}, ${stats.catCount} categories were developed..."${additionalCorrect}

================================================================================
`
  }
}

export default AntiHallucinationService
