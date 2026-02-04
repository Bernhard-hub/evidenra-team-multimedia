// MasterThesisGenerator.ts
// Vollständige Kapitel-Generierung für Masterarbeiten
// Portiert von EVIDENRA Ultimate für Team Multimedia

import { AntiHallucinationService, type AntiHallucinationProjectData } from './AntiHallucinationService'

export interface ChapterContext {
  thesisTitle: string
  thesisTopic: string
  chapterNumber: number
  chapterTitle: string
  targetWords: number
  previousChaptersSummary?: string
  researchQuestions?: string[]
  methodology?: string
  theoreticalFramework?: string
}

export interface ChapterSection {
  sectionNumber: string
  sectionTitle: string
  content: string
  wordCount: number
}

export interface CompleteChapter {
  chapterNumber: number
  chapterTitle: string
  abstract: string
  sections: ChapterSection[]
  totalWordCount: number
  isComplete: boolean
  qualityScore: number
  generatedAt: string
}

export interface ResearchData {
  documents?: Array<{ id: string; name: string; content?: string; wordCount?: number }>
  categories?: Array<{ id: string; name: string; description?: string }>
  codings?: Array<{ id: string; text?: string; categoryId?: string; documentId?: string }>
  projectName?: string
  methodology?: string
  methodologyName?: string
  researchQuestion?: string
}

export interface GenerationOptions {
  language: 'de' | 'en'
  academicLevel: 'bachelor' | 'master' | 'phd'
  citationStyle: 'APA' | 'Harvard' | 'IEEE' | 'Chicago'
  researchData?: ResearchData
  onProgress?: (percent: number, message: string) => void
  onSectionComplete?: (section: ChapterSection, allSections: ChapterSection[]) => void
}

// Standard chapter templates
export const CHAPTER_TEMPLATES = {
  de: {
    1: { title: 'Einleitung', sections: ['Problemstellung', 'Zielsetzung', 'Forschungsfragen', 'Aufbau der Arbeit'] },
    2: { title: 'Theoretischer Hintergrund', sections: ['Begriffsklärungen', 'Forschungsstand', 'Theoretischer Rahmen', 'Ableitung der Hypothesen'] },
    3: { title: 'Methodik', sections: ['Forschungsdesign', 'Datenerhebung', 'Datenauswertung', 'Gütekriterien'] },
    4: { title: 'Ergebnisse', sections: ['Deskriptive Ergebnisse', 'Hauptergebnisse', 'Zusätzliche Befunde'] },
    5: { title: 'Diskussion', sections: ['Interpretation der Ergebnisse', 'Einordnung in die Forschung', 'Limitationen', 'Implikationen'] },
    6: { title: 'Fazit', sections: ['Zusammenfassung', 'Schlussfolgerungen', 'Ausblick'] }
  },
  en: {
    1: { title: 'Introduction', sections: ['Problem Statement', 'Objectives', 'Research Questions', 'Thesis Structure'] },
    2: { title: 'Literature Review', sections: ['Key Concepts', 'State of Research', 'Theoretical Framework', 'Hypotheses'] },
    3: { title: 'Methodology', sections: ['Research Design', 'Data Collection', 'Data Analysis', 'Quality Criteria'] },
    4: { title: 'Results', sections: ['Descriptive Results', 'Main Findings', 'Additional Findings'] },
    5: { title: 'Discussion', sections: ['Interpretation', 'Research Context', 'Limitations', 'Implications'] },
    6: { title: 'Conclusion', sections: ['Summary', 'Conclusions', 'Future Research'] }
  }
}

export class MasterThesisGenerator {

  static async generateCompleteChapter(
    context: ChapterContext,
    apiKey: string,
    options: Partial<GenerationOptions> = {}
  ): Promise<CompleteChapter> {
    const opts: GenerationOptions = {
      language: 'de',
      academicLevel: 'master',
      citationStyle: 'APA',
      ...options
    }

    const { onProgress } = opts

    onProgress?.(5, opts.language === 'de' ? 'Starte Generierung...' : 'Starting generation...')

    try {
      // Step 1: Generate outline
      onProgress?.(10, opts.language === 'de' ? 'Erstelle Gliederung...' : 'Creating outline...')
      const outline = await this.generateChapterOutline(context, apiKey, opts)

      // Step 2: Generate each section
      const sections: ChapterSection[] = []
      const totalSections = outline.sections.length

      for (let i = 0; i < totalSections; i++) {
        const sectionOutline = outline.sections[i]
        const progress = 20 + ((i / totalSections) * 60)

        onProgress?.(
          progress,
          opts.language === 'de'
            ? `Generiere Abschnitt ${i + 1}/${totalSections}: ${sectionOutline.title}`
            : `Generating section ${i + 1}/${totalSections}: ${sectionOutline.title}`
        )

        const section = await this.generateSection(
          sectionOutline,
          context,
          apiKey,
          opts,
          sections
        )

        sections.push(section)

        if (opts.onSectionComplete) {
          opts.onSectionComplete(section, [...sections])
        }
      }

      // Step 3: Assemble chapter
      onProgress?.(85, opts.language === 'de' ? 'Füge Kapitel zusammen...' : 'Assembling chapter...')

      const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0)
      const meetsTarget = totalWordCount >= context.targetWords * 0.8

      const chapter: CompleteChapter = {
        chapterNumber: context.chapterNumber,
        chapterTitle: context.chapterTitle,
        abstract: outline.abstract,
        sections,
        totalWordCount,
        isComplete: meetsTarget,
        qualityScore: meetsTarget ? 0.9 : 0.7,
        generatedAt: new Date().toISOString()
      }

      onProgress?.(100, opts.language === 'de' ? 'Kapitel fertig!' : 'Chapter complete!')

      return chapter

    } catch (error: any) {
      console.error('[MasterThesisGenerator] Error:', error)
      throw error
    }
  }

  private static async generateChapterOutline(
    context: ChapterContext,
    apiKey: string,
    options: GenerationOptions
  ): Promise<{ abstract: string; sections: { number: string; title: string; targetWords: number }[] }> {
    const templates = CHAPTER_TEMPLATES[options.language]
    const template = templates[context.chapterNumber as keyof typeof templates]

    // Use template if available
    if (template) {
      const wordsPerSection = Math.floor(context.targetWords / template.sections.length)
      return {
        abstract: options.language === 'de'
          ? `Dieses Kapitel behandelt ${context.chapterTitle} im Kontext von "${context.thesisTopic}".`
          : `This chapter covers ${context.chapterTitle} in the context of "${context.thesisTopic}".`,
        sections: template.sections.map((title, i) => ({
          number: `${context.chapterNumber}.${i + 1}`,
          title,
          targetWords: wordsPerSection
        }))
      }
    }

    // Generate custom outline via API
    const systemPrompt = this.getOutlineSystemPrompt(options)
    const userPrompt = this.getOutlineUserPrompt(context, options)

    const response = await this.callAPI(apiKey, systemPrompt, userPrompt)
    return this.parseOutlineResponse(response, context)
  }

  private static async generateSection(
    sectionOutline: { number: string; title: string; targetWords: number },
    context: ChapterContext,
    apiKey: string,
    options: GenerationOptions,
    previousSections: ChapterSection[]
  ): Promise<ChapterSection> {
    // Build anti-hallucination context if research data available
    let antiHallContext = ''
    if (options.researchData) {
      const projectData: AntiHallucinationProjectData = {
        documents: options.researchData.documents?.map(d => ({
          id: d.id,
          name: d.name,
          content: d.content,
          wordCount: d.wordCount
        })),
        categories: options.researchData.categories?.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description
        })),
        codings: options.researchData.codings?.map(c => ({
          id: c.id,
          text: c.text,
          categoryId: c.categoryId,
          documentId: c.documentId
        })),
        projectName: options.researchData.projectName,
        methodology: options.researchData.methodology,
        methodologyName: options.researchData.methodologyName,
        researchQuestion: options.researchData.researchQuestion
      }

      antiHallContext = AntiHallucinationService.generateContext(projectData, {
        language: options.language,
        serviceName: 'MasterThesisGenerator',
        showInterviewWarning: true,
        enforceMethodologyConsistency: true
      })
    }

    const systemPrompt = this.getSectionSystemPrompt(options, antiHallContext)
    const userPrompt = this.getSectionUserPrompt(sectionOutline, context, options, previousSections)

    const content = await this.callAPI(apiKey, systemPrompt, userPrompt)
    const cleanContent = this.cleanContent(content)
    const wordCount = this.countWords(cleanContent)

    return {
      sectionNumber: sectionOutline.number,
      sectionTitle: sectionOutline.title,
      content: cleanContent,
      wordCount
    }
  }

  private static getOutlineSystemPrompt(options: GenerationOptions): string {
    const lang = options.language === 'de' ? {
      role: 'wissenschaftlicher Schreibassistent',
      task: 'Erstelle eine Gliederung für ein Kapitel einer akademischen Arbeit',
      format: 'JSON mit abstract und sections Array'
    } : {
      role: 'academic writing assistant',
      task: 'Create an outline for a chapter of an academic thesis',
      format: 'JSON with abstract and sections array'
    }

    return `Du bist ein ${lang.role} auf ${options.academicLevel}-Niveau.

${lang.task}.

Ausgabeformat: ${lang.format}
{
  "abstract": "Kurze Zusammenfassung des Kapitels (2-3 Sätze)",
  "sections": [
    { "number": "X.1", "title": "Titel", "targetWords": 500 }
  ]
}

Zitationsstil: ${options.citationStyle}
Sprache: ${options.language === 'de' ? 'Deutsch' : 'English'}`
  }

  private static getOutlineUserPrompt(context: ChapterContext, options: GenerationOptions): string {
    const lang = options.language === 'de' ? {
      thesis: 'Arbeitstitel',
      topic: 'Thema',
      chapter: 'Kapitel',
      target: 'Ziel-Wortanzahl',
      questions: 'Forschungsfragen',
      methodology: 'Methodik',
      framework: 'Theoretischer Rahmen',
      previous: 'Bisherige Kapitel'
    } : {
      thesis: 'Thesis Title',
      topic: 'Topic',
      chapter: 'Chapter',
      target: 'Target Word Count',
      questions: 'Research Questions',
      methodology: 'Methodology',
      framework: 'Theoretical Framework',
      previous: 'Previous Chapters'
    }

    return `${lang.thesis}: ${context.thesisTitle}
${lang.topic}: ${context.thesisTopic}
${lang.chapter} ${context.chapterNumber}: ${context.chapterTitle}
${lang.target}: ${context.targetWords} Wörter

${context.researchQuestions ? `${lang.questions}:\n${context.researchQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}
${context.methodology ? `${lang.methodology}: ${context.methodology}` : ''}
${context.theoreticalFramework ? `${lang.framework}: ${context.theoreticalFramework}` : ''}
${context.previousChaptersSummary ? `${lang.previous}: ${context.previousChaptersSummary}` : ''}

Erstelle eine passende Gliederung für dieses Kapitel.`
  }

  private static getSectionSystemPrompt(options: GenerationOptions, antiHallContext: string): string {
    const level = {
      bachelor: options.language === 'de' ? 'Bachelor-Arbeit' : 'Bachelor thesis',
      master: options.language === 'de' ? 'Master-Arbeit' : 'Master thesis',
      phd: options.language === 'de' ? 'Dissertation' : 'PhD thesis'
    }[options.academicLevel]

    return `Du bist ein erfahrener akademischer Autor, spezialisiert auf ${level}en.

AUFGABE: Schreibe einen vollständigen Abschnitt einer wissenschaftlichen Arbeit.

STIL-ANFORDERUNGEN:
- Akademischer Schreibstil auf ${options.academicLevel}-Niveau
- Zitationsstil: ${options.citationStyle}
- Sprache: ${options.language === 'de' ? 'Deutsch' : 'English'}
- Strukturiert mit Absätzen
- Fachlich fundiert und wissenschaftlich präzise

${antiHallContext}

WICHTIG:
- Schreibe VOLLSTÄNDIGE Absätze, keine Platzhalter!
- Verwende Übergänge zwischen Absätzen
- Belege wichtige Aussagen (ggf. mit Platzhalter-Zitaten wie "Autor, Jahr")
- Vermeide Wiederholungen aus vorherigen Abschnitten`
  }

  private static getSectionUserPrompt(
    sectionOutline: { number: string; title: string; targetWords: number },
    context: ChapterContext,
    options: GenerationOptions,
    previousSections: ChapterSection[]
  ): string {
    const previousContent = previousSections.length > 0
      ? `\n\nBISHERIGE ABSCHNITTE:\n${previousSections.map(s => `${s.sectionNumber} ${s.sectionTitle}: ${s.content.substring(0, 200)}...`).join('\n')}`
      : ''

    return `ARBEIT: ${context.thesisTitle}
KAPITEL ${context.chapterNumber}: ${context.chapterTitle}

ABSCHNITT: ${sectionOutline.number} ${sectionOutline.title}
ZIEL: ~${sectionOutline.targetWords} Wörter

${context.researchQuestions ? `FORSCHUNGSFRAGEN:\n${context.researchQuestions.join('\n')}` : ''}
${context.methodology ? `METHODIK: ${context.methodology}` : ''}
${previousContent}

Schreibe den Abschnitt "${sectionOutline.title}" vollständig aus.
Verwende akademischen Stil und strukturiere den Text in mehrere Absätze.`
  }

  private static async callAPI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.content?.[0]?.text || ''
  }

  private static parseOutlineResponse(
    response: string,
    context: ChapterContext
  ): { abstract: string; sections: { number: string; title: string; targetWords: number }[] } {
    try {
      // Try to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          abstract: parsed.abstract || '',
          sections: parsed.sections || []
        }
      }
    } catch {
      // Fallback to default structure
    }

    // Default structure
    return {
      abstract: `Kapitel ${context.chapterNumber}: ${context.chapterTitle}`,
      sections: [
        { number: `${context.chapterNumber}.1`, title: 'Einführung', targetWords: Math.floor(context.targetWords / 3) },
        { number: `${context.chapterNumber}.2`, title: 'Hauptteil', targetWords: Math.floor(context.targetWords / 3) },
        { number: `${context.chapterNumber}.3`, title: 'Zusammenfassung', targetWords: Math.floor(context.targetWords / 3) }
      ]
    }
  }

  private static cleanContent(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[.*?\]/g, (match) => match.includes('http') ? '' : match) // Remove URLs but keep citations
      .trim()
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length
  }

  // Generate full thesis structure
  static generateThesisStructure(
    title: string,
    topic: string,
    language: 'de' | 'en'
  ): ChapterContext[] {
    const templates = CHAPTER_TEMPLATES[language]
    const chapters: ChapterContext[] = []

    Object.entries(templates).forEach(([num, template]) => {
      chapters.push({
        thesisTitle: title,
        thesisTopic: topic,
        chapterNumber: parseInt(num),
        chapterTitle: template.title,
        targetWords: num === '1' || num === '6' ? 2000 : 4000
      })
    })

    return chapters
  }

  // Export chapter to markdown
  static exportToMarkdown(chapter: CompleteChapter): string {
    let md = `# Kapitel ${chapter.chapterNumber}: ${chapter.chapterTitle}\n\n`
    md += `*${chapter.abstract}*\n\n`

    chapter.sections.forEach(section => {
      md += `## ${section.sectionNumber} ${section.sectionTitle}\n\n`
      md += `${section.content}\n\n`
    })

    md += `---\n*Generiert am: ${chapter.generatedAt}*\n`
    md += `*Wortanzahl: ${chapter.totalWordCount}*\n`

    return md
  }
}

export default MasterThesisGenerator
