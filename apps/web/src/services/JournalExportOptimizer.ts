// JournalExportOptimizer.ts
// Metaprompt System für Journal-Specific Export
// Portiert von EVIDENRA Ultimate für Team Multimedia

export interface JournalProfile {
  id: string
  name: string
  category: 'top-tier' | 'high-impact' | 'specialized' | 'open-access'
  guidelines: {
    abstractWordLimit?: number
    mainTextWordLimit?: number
    sectionStructure?: string[]
    citationStyle: 'APA' | 'Harvard' | 'Vancouver' | 'Chicago' | 'Nature' | 'Science'
    highlightsRequired?: boolean
    highlightsCount?: number
    coverLetterRequired: boolean
    ethicsStatementRequired: boolean
    dataAvailabilityRequired: boolean
  }
  focusAreas: string[]
  reviewCriteria: string[]
}

export interface ArticleContent {
  title: string
  abstract: string
  introduction: string
  methods: string
  results: string
  discussion: string
  conclusion: string
  references: string[]
  keywords?: string[]
  researchQuestions?: string[]
  mainFindings?: string[]
}

export interface OptimizedExport {
  journalId: string
  journalName: string
  formattedArticle: {
    title: string
    abstract: string
    highlights?: string[]
    mainSections: { [key: string]: string }
    keywords: string[]
    wordCount: {
      abstract: number
      mainText: number
    }
  }
  coverLetter: string
  submissionChecklist: Array<{
    item: string
    status: 'auto-completed' | 'requires-input' | 'not-applicable'
    notes?: string
  }>
  optimizationNotes: string[]
}

export interface ExportOptions {
  language: 'de' | 'en'
  targetJournal: JournalProfile
  emphasizeNovelty: boolean
  onProgress?: (percent: number, message: string) => void
}

// Predefined Journal Profiles
export const JOURNAL_PROFILES: { [key: string]: JournalProfile } = {
  nature: {
    id: 'nature',
    name: 'Nature',
    category: 'top-tier',
    guidelines: {
      abstractWordLimit: 200,
      mainTextWordLimit: 3000,
      sectionStructure: ['Introduction', 'Results', 'Discussion', 'Methods'],
      citationStyle: 'Nature',
      highlightsRequired: false,
      coverLetterRequired: true,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: true
    },
    focusAreas: ['Broad significance', 'Novel methodology', 'Paradigm-shifting findings'],
    reviewCriteria: ['Novelty', 'Significance', 'Methodology rigor', 'Clarity']
  },
  science: {
    id: 'science',
    name: 'Science',
    category: 'top-tier',
    guidelines: {
      abstractWordLimit: 125,
      mainTextWordLimit: 2500,
      citationStyle: 'Science',
      coverLetterRequired: true,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: true
    },
    focusAreas: ['Breakthrough discoveries', 'Interdisciplinary impact', 'Global relevance'],
    reviewCriteria: ['Impact', 'Novelty', 'Rigour', 'Presentation']
  },
  plosone: {
    id: 'plosone',
    name: 'PLOS ONE',
    category: 'open-access',
    guidelines: {
      abstractWordLimit: 300,
      sectionStructure: ['Introduction', 'Materials and Methods', 'Results', 'Discussion'],
      citationStyle: 'Vancouver',
      coverLetterRequired: true,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: true
    },
    focusAreas: ['Scientific rigor', 'Reproducibility', 'Open science'],
    reviewCriteria: ['Methodological soundness', 'Data quality', 'Conclusions supported by data']
  },
  frontiers: {
    id: 'frontiers',
    name: 'Frontiers in Psychology',
    category: 'open-access',
    guidelines: {
      abstractWordLimit: 250,
      mainTextWordLimit: 12000,
      citationStyle: 'APA',
      highlightsRequired: true,
      highlightsCount: 5,
      coverLetterRequired: false,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: true
    },
    focusAreas: ['Innovation', 'Interdisciplinarity', 'Impact'],
    reviewCriteria: ['Originality', 'Quality', 'Significance', 'Ethics']
  },
  qualitativeResearch: {
    id: 'qualitative-research',
    name: 'Qualitative Research',
    category: 'specialized',
    guidelines: {
      abstractWordLimit: 200,
      mainTextWordLimit: 8000,
      citationStyle: 'APA',
      highlightsRequired: false,
      coverLetterRequired: true,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: false
    },
    focusAreas: ['Methodological innovation', 'Theoretical contribution', 'Reflexivity'],
    reviewCriteria: ['Methodological rigor', 'Transparency', 'Trustworthiness', 'Contribution']
  },
  forumQualitative: {
    id: 'forum-qualitative',
    name: 'Forum Qualitative Sozialforschung (FQS)',
    category: 'open-access',
    guidelines: {
      abstractWordLimit: 250,
      mainTextWordLimit: 10000,
      citationStyle: 'APA',
      highlightsRequired: false,
      coverLetterRequired: false,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: false
    },
    focusAreas: ['Qualitative methods', 'Social research', 'Interdisciplinary approaches'],
    reviewCriteria: ['Methodological transparency', 'Theoretical grounding', 'Empirical quality']
  }
}

export class JournalExportOptimizer {

  static getOptimizationSystemPrompt(options: ExportOptions): string {
    const { language, targetJournal, emphasizeNovelty } = options

    return `# ROLE
You are an expert academic editor specializing in preparing manuscripts for ${targetJournal.name}.

# JOURNAL: ${targetJournal.name}

**Category**: ${targetJournal.category}
**Citation Style**: ${targetJournal.guidelines.citationStyle}
**Abstract Limit**: ${targetJournal.guidelines.abstractWordLimit || 'Not specified'} words
**Focus Areas**: ${targetJournal.focusAreas.join(', ')}
**Review Criteria**: ${targetJournal.reviewCriteria.join(', ')}

${targetJournal.guidelines.sectionStructure ? `**Required Structure**: ${targetJournal.guidelines.sectionStructure.join(' → ')}` : ''}

# OPTIMIZATION TASKS

1. **Abstract**: ${targetJournal.guidelines.abstractWordLimit ? `Stay within ${targetJournal.guidelines.abstractWordLimit} words` : 'Concise and impactful'}
2. **Title**: Align with ${targetJournal.name} conventions
${targetJournal.guidelines.highlightsRequired ? `3. **Highlights**: Create ${targetJournal.guidelines.highlightsCount || 5} highlights (85 chars each)` : ''}
4. **Sections**: ${targetJournal.guidelines.sectionStructure ? `Match required structure` : 'Follow IMRAD'}
5. **Tone**: Match ${targetJournal.name}'s editorial style
${targetJournal.guidelines.coverLetterRequired ? '6. **Cover Letter**: Create compelling submission letter' : ''}

# OUTPUT FORMAT
Return JSON with: formattedArticle, coverLetter, submissionChecklist, optimizationNotes

# LANGUAGE
${language === 'de' ? 'German text, English for journal-standard sections' : 'English'}

# EMPHASIS
${emphasizeNovelty ? 'Highlight novel contributions and impact' : 'Focus on rigor and reproducibility'}`
  }

  static getOptimizationUserPrompt(article: ArticleContent, journal: JournalProfile): string {
    const abstractWords = article.abstract.split(' ').length
    const totalWords = [article.introduction, article.methods, article.results, article.discussion, article.conclusion]
      .join(' ').split(' ').length

    return `# ARTICLE TO OPTIMIZE FOR ${journal.name}

**Current Title**: ${article.title}
**Abstract** (${abstractWords} words): ${article.abstract}
**Keywords**: ${article.keywords?.join(', ') || 'Not specified'}

**Research Questions**: ${article.researchQuestions?.join('; ') || 'Not specified'}
**Main Findings**: ${article.mainFindings?.join('; ') || 'Not specified'}

**Introduction** (${article.introduction.split(' ').length} words): ${article.introduction.substring(0, 800)}...

**Methods** (${article.methods.split(' ').length} words): ${article.methods.substring(0, 500)}...

**Results** (${article.results.split(' ').length} words): ${article.results.substring(0, 800)}...

**Discussion** (${article.discussion.split(' ').length} words): ${article.discussion.substring(0, 800)}...

**Total Word Count**: ~${totalWords} words

# REQUIREMENTS
${journal.guidelines.abstractWordLimit ? `- Abstract ≤ ${journal.guidelines.abstractWordLimit} words` : ''}
${journal.guidelines.mainTextWordLimit ? `- Main text ≤ ${journal.guidelines.mainTextWordLimit} words` : ''}
${journal.guidelines.highlightsRequired ? `- ${journal.guidelines.highlightsCount || 5} highlights` : ''}
${journal.guidelines.sectionStructure ? `- Sections: ${journal.guidelines.sectionStructure.join(', ')}` : ''}

Optimize and return JSON.`
  }

  static async optimizeForJournal(
    article: ArticleContent,
    options: ExportOptions,
    apiFunction: (systemPrompt: string, userPrompt: string) => Promise<string>
  ): Promise<OptimizedExport> {
    const { targetJournal, onProgress } = options

    try {
      onProgress?.(10, `Analyzing ${targetJournal.name} guidelines...`)

      const systemPrompt = this.getOptimizationSystemPrompt(options)
      const userPrompt = this.getOptimizationUserPrompt(article, targetJournal)

      onProgress?.(30, 'Optimizing article...')

      const response = await apiFunction(systemPrompt, userPrompt)

      onProgress?.(80, 'Processing optimized export...')

      const data = JSON.parse(this.extractJSON(response))

      onProgress?.(100, 'Complete!')

      return data.optimizedExport || data

    } catch (error: any) {
      console.error('[JournalExportOptimizer] Error:', error)
      throw error
    }
  }

  static getJournalProfile(journalId: string): JournalProfile | undefined {
    return JOURNAL_PROFILES[journalId]
  }

  static listJournals(): JournalProfile[] {
    return Object.values(JOURNAL_PROFILES)
  }

  private static extractJSON(text: string): string {
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim()
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return jsonMatch[0]
    }

    return text
  }

  // Generate quick summary for UI
  static generateQuickSummary(article: ArticleContent, journal: JournalProfile, language: 'de' | 'en'): {
    issues: string[]
    suggestions: string[]
    readiness: number
  } {
    const issues: string[] = []
    const suggestions: string[] = []
    let readiness = 100

    const abstractWords = article.abstract.split(' ').length
    const totalWords = [article.introduction, article.methods, article.results, article.discussion, article.conclusion]
      .join(' ').split(' ').length

    // Check abstract
    if (journal.guidelines.abstractWordLimit && abstractWords > journal.guidelines.abstractWordLimit) {
      issues.push(language === 'de'
        ? `Abstract zu lang: ${abstractWords}/${journal.guidelines.abstractWordLimit} Wörter`
        : `Abstract too long: ${abstractWords}/${journal.guidelines.abstractWordLimit} words`)
      readiness -= 15
    }

    // Check total length
    if (journal.guidelines.mainTextWordLimit && totalWords > journal.guidelines.mainTextWordLimit) {
      issues.push(language === 'de'
        ? `Haupttext zu lang: ${totalWords}/${journal.guidelines.mainTextWordLimit} Wörter`
        : `Main text too long: ${totalWords}/${journal.guidelines.mainTextWordLimit} words`)
      readiness -= 20
    }

    // Check highlights
    if (journal.guidelines.highlightsRequired && (!article.mainFindings || article.mainFindings.length === 0)) {
      issues.push(language === 'de'
        ? 'Highlights fehlen (erforderlich)'
        : 'Highlights missing (required)')
      readiness -= 10
    }

    // Check keywords
    if (!article.keywords || article.keywords.length < 3) {
      suggestions.push(language === 'de'
        ? 'Mehr Keywords hinzufügen (mind. 3-5)'
        : 'Add more keywords (at least 3-5)')
      readiness -= 5
    }

    // Journal-specific suggestions
    if (journal.category === 'top-tier') {
      suggestions.push(language === 'de'
        ? 'Betone die breite Bedeutung und Neuartigkeit der Ergebnisse'
        : 'Emphasize broad significance and novelty of findings')
    }

    return {
      issues,
      suggestions,
      readiness: Math.max(0, readiness)
    }
  }
}

export default JournalExportOptimizer
