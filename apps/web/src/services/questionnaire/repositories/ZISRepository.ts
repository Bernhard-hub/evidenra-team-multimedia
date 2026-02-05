/**
 * ZIS/GESIS Repository Connector
 * EVIDENRA Research - Scientific Questionnaire Development System
 *
 * ZIS (Zusammenstellung sozialwissenschaftlicher Items und Skalen) is the
 * primary German-language repository for validated social science scales.
 *
 * Since ZIS doesn't provide a public REST API, this service:
 * 1. Maintains a curated database of common scales
 * 2. Provides search functionality
 * 3. Links to ZIS for full scale access
 * 4. Can be extended with SPARQL queries to GESIS Knowledge Graph
 *
 * @see https://zis.gesis.org
 * @see https://data.gesis.org/gesiskg/sparql
 */

import { Scale, ScaleItem, ResponseFormat, ValidationInfo } from '../types'

// ============================================================================
// ZIS SCALE DATABASE (Curated Common Scales)
// ============================================================================

export interface ZISScale {
  id: string
  doi: string
  name: string
  nameEn?: string
  authors: string[]
  year: number
  construct: string
  constructEn?: string
  dimensions?: string[]
  itemCount: number
  language: ('de' | 'en')[]
  responseFormat: ResponseFormat
  validation: {
    cronbachAlpha?: number
    sampleSize?: number
    sampleDescription?: string
  }
  keywords: string[]
  zisUrl: string
  citation: string
}

/**
 * Curated database of commonly used ZIS scales
 * This represents a subset of the 300+ scales available at ZIS
 */
export const ZIS_SCALES_DATABASE: ZISScale[] = [
  // ============================================================================
  // PERSONALITY & INDIVIDUAL DIFFERENCES
  // ============================================================================
  {
    id: 'bfi-10',
    doi: '10.6102/zis76',
    name: 'Big Five Inventory-10 (BFI-10)',
    nameEn: 'Big Five Inventory-10',
    authors: ['Rammstedt, B.', 'John, O. P.'],
    year: 2007,
    construct: 'Persönlichkeit (Big Five)',
    constructEn: 'Personality (Big Five)',
    dimensions: ['Extraversion', 'Verträglichkeit', 'Gewissenhaftigkeit', 'Neurotizismus', 'Offenheit'],
    itemCount: 10,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 5, anchors: ['Trifft überhaupt nicht zu', 'Trifft voll und ganz zu'] },
    validation: { cronbachAlpha: 0.75, sampleSize: 1134, sampleDescription: 'Deutsche Erwachsene' },
    keywords: ['persönlichkeit', 'big five', 'extraversion', 'neurotizismus', 'personality'],
    zisUrl: 'https://zis.gesis.org/skala/Rammstedt-John-Big-Five-Inventory-10-(BFI-10)',
    citation: 'Rammstedt, B., & John, O. P. (2007). Measuring personality in one minute or less: A 10-item short version of the Big Five Inventory in English and German. Journal of Research in Personality, 41, 203-212.',
  },
  {
    id: 'bfi-2-xs',
    doi: '10.6102/zis278',
    name: 'Big Five Inventory-2 Extra Short Form (BFI-2-XS)',
    authors: ['Soto, C. J.', 'John, O. P.'],
    year: 2017,
    construct: 'Persönlichkeit (Big Five)',
    dimensions: ['Extraversion', 'Verträglichkeit', 'Gewissenhaftigkeit', 'Negative Emotionalität', 'Offenheit'],
    itemCount: 15,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 5 },
    validation: { cronbachAlpha: 0.70, sampleSize: 1500 },
    keywords: ['persönlichkeit', 'big five', 'kurzskala'],
    zisUrl: 'https://zis.gesis.org/skala/Soto-John-Big-Five-Inventory-2-Extra-Short-Form-(BFI-2-XS)',
    citation: 'Soto, C. J., & John, O. P. (2017). Short and extra-short forms of the Big Five Inventory–2. Journal of Research in Personality, 68, 69-81.',
  },
  {
    id: 'ses-rosenberg',
    doi: '10.6102/zis16',
    name: 'Rosenberg Self-Esteem Scale (RSES)',
    nameEn: 'Rosenberg Self-Esteem Scale',
    authors: ['Rosenberg, M.'],
    year: 1965,
    construct: 'Selbstwertgefühl',
    constructEn: 'Self-Esteem',
    itemCount: 10,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 4, anchors: ['Stimmt nicht', 'Stimmt'] },
    validation: { cronbachAlpha: 0.88, sampleSize: 2056, sampleDescription: 'Deutsche Bevölkerung' },
    keywords: ['selbstwert', 'selbstbewusstsein', 'self-esteem', 'selbstkonzept'],
    zisUrl: 'https://zis.gesis.org/skala/Rosenberg-Rosenberg-Self-Esteem-Scale-(RSES)',
    citation: 'Rosenberg, M. (1965). Society and the adolescent self-image. Princeton University Press.',
  },
  {
    id: 'swls',
    doi: '10.6102/zis147',
    name: 'Satisfaction with Life Scale (SWLS)',
    authors: ['Diener, E.', 'Emmons, R. A.', 'Larsen, R. J.', 'Griffin, S.'],
    year: 1985,
    construct: 'Lebenszufriedenheit',
    constructEn: 'Life Satisfaction',
    itemCount: 5,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 7, anchors: ['Stimme überhaupt nicht zu', 'Stimme voll und ganz zu'] },
    validation: { cronbachAlpha: 0.87, sampleSize: 176 },
    keywords: ['lebenszufriedenheit', 'wohlbefinden', 'life satisfaction', 'well-being'],
    zisUrl: 'https://zis.gesis.org/skala/Diener-Emmons-Larsen-Griffin-Satisfaction-With-Life-Scale-(SWLS)',
    citation: 'Diener, E., Emmons, R. A., Larsen, R. J., & Griffin, S. (1985). The Satisfaction With Life Scale. Journal of Personality Assessment, 49, 71-75.',
  },
  {
    id: 'loc-ie4',
    doi: '10.6102/zis219',
    name: 'Internale-Externale-Kontrollüberzeugung-4 (IE-4)',
    nameEn: 'Locus of Control Short Scale',
    authors: ['Kovaleva, A.', 'Beierlein, C.', 'Kemper, C. J.', 'Rammstedt, B.'],
    year: 2012,
    construct: 'Kontrollüberzeugung',
    constructEn: 'Locus of Control',
    dimensions: ['Internal', 'External'],
    itemCount: 4,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 5 },
    validation: { cronbachAlpha: 0.71, sampleSize: 1134 },
    keywords: ['kontrollüberzeugung', 'locus of control', 'internal', 'external'],
    zisUrl: 'https://zis.gesis.org/skala/Kovaleva-Beierlein-Kemper-Rammstedt-Internale-Externale-Kontrollueberzeugung-4-(IE-4)',
    citation: 'Kovaleva, A., Beierlein, C., Kemper, C. J., & Rammstedt, B. (2012). Eine Kurzskala zur Messung von Kontrollüberzeugung. GESIS-Working Papers, 2012/19.',
  },

  // ============================================================================
  // WORK & ORGANIZATIONAL
  // ============================================================================
  {
    id: 'arbeitszufriedenheit-kunin',
    doi: '10.6102/zis2',
    name: 'Arbeitszufriedenheit (Kunin-Skala)',
    nameEn: 'Job Satisfaction (Kunin Scale)',
    authors: ['Kunin, T.'],
    year: 1955,
    construct: 'Arbeitszufriedenheit',
    constructEn: 'Job Satisfaction',
    itemCount: 1,
    language: ['de', 'en'],
    responseFormat: { type: 'visual-analog', points: 7 },
    validation: { sampleSize: 200 },
    keywords: ['arbeitszufriedenheit', 'job satisfaction', 'beruf', 'arbeit'],
    zisUrl: 'https://zis.gesis.org/skala/Kunin-Arbeitszufriedenheit',
    citation: 'Kunin, T. (1955). The construction of a new type of attitude measure. Personnel Psychology, 8, 65-78.',
  },
  {
    id: 'olbi',
    doi: '10.6102/zis221',
    name: 'Oldenburg Burnout Inventory (OLBI)',
    authors: ['Demerouti, E.', 'Bakker, A. B.'],
    year: 2008,
    construct: 'Burnout',
    dimensions: ['Erschöpfung', 'Disengagement'],
    itemCount: 16,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 4, anchors: ['Stimmt nicht', 'Stimmt'] },
    validation: { cronbachAlpha: 0.85, sampleSize: 2000 },
    keywords: ['burnout', 'erschöpfung', 'arbeit', 'stress', 'engagement'],
    zisUrl: 'https://zis.gesis.org/skala/Demerouti-Nachreiner-Oldenburg-Burnout-Inventory-(OLBI)',
    citation: 'Demerouti, E., & Bakker, A. B. (2008). The Oldenburg Burnout Inventory: A good alternative to measure burnout and engagement. Handbook of Stress and Burnout in Health Care.',
  },
  {
    id: 'uwes-9',
    doi: '10.6102/zis254',
    name: 'Utrecht Work Engagement Scale (UWES-9)',
    authors: ['Schaufeli, W. B.', 'Bakker, A. B.'],
    year: 2003,
    construct: 'Arbeitsengagement',
    constructEn: 'Work Engagement',
    dimensions: ['Vigor', 'Dedication', 'Absorption'],
    itemCount: 9,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 7, anchors: ['Nie', 'Immer'] },
    validation: { cronbachAlpha: 0.92, sampleSize: 14521 },
    keywords: ['engagement', 'arbeit', 'motivation', 'work engagement'],
    zisUrl: 'https://zis.gesis.org/skala/Schaufeli-Bakker-Utrecht-Work-Engagement-Scale-(UWES)',
    citation: 'Schaufeli, W. B., & Bakker, A. B. (2003). UWES – Utrecht Work Engagement Scale: Test Manual. Utrecht University.',
  },

  // ============================================================================
  // HEALTH & WELL-BEING
  // ============================================================================
  {
    id: 'phq-9',
    doi: '10.6102/zis305',
    name: 'Patient Health Questionnaire-9 (PHQ-9)',
    authors: ['Kroenke, K.', 'Spitzer, R. L.', 'Williams, J. B.'],
    year: 2001,
    construct: 'Depression',
    itemCount: 9,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 4, anchors: ['Überhaupt nicht', 'Beinahe jeden Tag'] },
    validation: { cronbachAlpha: 0.89, sampleSize: 6000 },
    keywords: ['depression', 'mental health', 'screening', 'psychische gesundheit'],
    zisUrl: 'https://zis.gesis.org/skala/Kroenke-Spitzer-Williams-Patient-Health-Questionnaire-9-(PHQ-9)',
    citation: 'Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: validity of a brief depression severity measure. Journal of General Internal Medicine, 16, 606-613.',
  },
  {
    id: 'gad-7',
    doi: '10.6102/zis304',
    name: 'Generalized Anxiety Disorder Scale-7 (GAD-7)',
    authors: ['Spitzer, R. L.', 'Kroenke, K.', 'Williams, J. B.', 'Löwe, B.'],
    year: 2006,
    construct: 'Angststörung',
    constructEn: 'Anxiety',
    itemCount: 7,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 4, anchors: ['Überhaupt nicht', 'Beinahe jeden Tag'] },
    validation: { cronbachAlpha: 0.92, sampleSize: 2740 },
    keywords: ['angst', 'anxiety', 'mental health', 'screening'],
    zisUrl: 'https://zis.gesis.org/skala/Spitzer-Kroenke-Williams-Loewe-GAD-7',
    citation: 'Spitzer, R. L., Kroenke, K., Williams, J. B., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder. Archives of Internal Medicine, 166, 1092-1097.',
  },
  {
    id: 'who-5',
    doi: '10.6102/zis161',
    name: 'WHO-5 Wohlbefindens-Index',
    nameEn: 'WHO-5 Well-Being Index',
    authors: ['WHO'],
    year: 1998,
    construct: 'Psychisches Wohlbefinden',
    constructEn: 'Psychological Well-Being',
    itemCount: 5,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 6, anchors: ['Zu keinem Zeitpunkt', 'Die ganze Zeit'] },
    validation: { cronbachAlpha: 0.84 },
    keywords: ['wohlbefinden', 'well-being', 'lebensqualität', 'mental health'],
    zisUrl: 'https://zis.gesis.org/skala/WHO-WHO-5-Wohlbefindens-Index',
    citation: 'WHO. (1998). Wellbeing Measures in Primary Health Care/The Depcare Project. WHO Regional Office for Europe.',
  },
  {
    id: 'pss-10',
    doi: '10.6102/zis284',
    name: 'Perceived Stress Scale (PSS-10)',
    authors: ['Cohen, S.', 'Kamarck, T.', 'Mermelstein, R.'],
    year: 1983,
    construct: 'Wahrgenommener Stress',
    constructEn: 'Perceived Stress',
    itemCount: 10,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 5, anchors: ['Nie', 'Sehr oft'] },
    validation: { cronbachAlpha: 0.84, sampleSize: 2387 },
    keywords: ['stress', 'belastung', 'perceived stress'],
    zisUrl: 'https://zis.gesis.org/skala/Cohen-Kamarck-Mermelstein-Perceived-Stress-Scale-(PSS)',
    citation: 'Cohen, S., Kamarck, T., & Mermelstein, R. (1983). A global measure of perceived stress. Journal of Health and Social Behavior, 24, 385-396.',
  },

  // ============================================================================
  // SOCIAL & POLITICAL
  // ============================================================================
  {
    id: 'soz-vertrauen',
    doi: '10.6102/zis39',
    name: 'Allgemeines Soziales Vertrauen',
    nameEn: 'Generalized Social Trust',
    authors: ['Delhey, J.', 'Newton, K.'],
    year: 2003,
    construct: 'Soziales Vertrauen',
    constructEn: 'Social Trust',
    itemCount: 3,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 4 },
    validation: { cronbachAlpha: 0.70 },
    keywords: ['vertrauen', 'sozial', 'trust', 'gesellschaft'],
    zisUrl: 'https://zis.gesis.org/skala/Delhey-Newton-Allgemeines-Soziales-Vertrauen',
    citation: 'Delhey, J., & Newton, K. (2003). Who trusts? The origins of social trust in seven societies. European Societies, 5, 93-137.',
  },
  {
    id: 'pol-interesse',
    doi: '10.6102/zis171',
    name: 'Politisches Interesse',
    nameEn: 'Political Interest',
    authors: ['GESIS'],
    year: 2014,
    construct: 'Politisches Interesse',
    constructEn: 'Political Interest',
    itemCount: 1,
    language: ['de'],
    responseFormat: { type: 'likert', points: 5, anchors: ['Überhaupt nicht', 'Sehr stark'] },
    validation: {},
    keywords: ['politik', 'interesse', 'political interest', 'demokratie'],
    zisUrl: 'https://zis.gesis.org/skala/GESIS-Politisches-Interesse',
    citation: 'GESIS (2014). Politisches Interesse. ZIS - GESIS Leibniz-Institut für Sozialwissenschaften.',
  },
  {
    id: 'sdo-8',
    doi: '10.6102/zis298',
    name: 'Social Dominance Orientation Scale (SDO-8)',
    authors: ['Ho, A. K.', 'Sidanius, J.', 'Kteily, N.', 'et al.'],
    year: 2015,
    construct: 'Soziale Dominanzorientierung',
    constructEn: 'Social Dominance Orientation',
    dimensions: ['Dominanz', 'Antiegalitarismus'],
    itemCount: 8,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 7 },
    validation: { cronbachAlpha: 0.87 },
    keywords: ['dominanz', 'gleichheit', 'social dominance', 'hierarchie'],
    zisUrl: 'https://zis.gesis.org/skala/Ho-Sidanius-Kteily-et-al-SDO7',
    citation: 'Ho, A. K., Sidanius, J., Kteily, N., et al. (2015). The nature of social dominance orientation. Journal of Personality and Social Psychology, 109, 1003-1028.',
  },

  // ============================================================================
  // EDUCATION & LEARNING
  // ============================================================================
  {
    id: 'selbstwirksamkeit',
    doi: '10.6102/zis35',
    name: 'Allgemeine Selbstwirksamkeitserwartung (SWE)',
    nameEn: 'General Self-Efficacy Scale',
    authors: ['Schwarzer, R.', 'Jerusalem, M.'],
    year: 1999,
    construct: 'Selbstwirksamkeit',
    constructEn: 'Self-Efficacy',
    itemCount: 10,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 4, anchors: ['Stimmt nicht', 'Stimmt genau'] },
    validation: { cronbachAlpha: 0.86, sampleSize: 19120 },
    keywords: ['selbstwirksamkeit', 'self-efficacy', 'kompetenz', 'überzeugung'],
    zisUrl: 'https://zis.gesis.org/skala/Schwarzer-Jerusalem-Allgemeine-Selbstwirksamkeitserwartung-(SWE)',
    citation: 'Schwarzer, R., & Jerusalem, M. (1999). Skalen zur Erfassung von Lehrer- und Schülermerkmalen. Freie Universität Berlin.',
  },
  {
    id: 'nfc-16',
    doi: '10.6102/zis230',
    name: 'Need for Cognition (NFC-16)',
    authors: ['Cacioppo, J. T.', 'Petty, R. E.', 'Kao, C. F.'],
    year: 1984,
    construct: 'Kognitionsbedürfnis',
    constructEn: 'Need for Cognition',
    itemCount: 16,
    language: ['de', 'en'],
    responseFormat: { type: 'likert', points: 7 },
    validation: { cronbachAlpha: 0.87 },
    keywords: ['kognition', 'denken', 'need for cognition', 'intellekt'],
    zisUrl: 'https://zis.gesis.org/skala/Cacioppo-Petty-Kao-Need-for-Cognition-(NFC)',
    citation: 'Cacioppo, J. T., Petty, R. E., & Kao, C. F. (1984). The efficient assessment of need for cognition. Journal of Personality Assessment, 48, 306-307.',
  },
]

// ============================================================================
// ZIS REPOSITORY SERVICE
// ============================================================================

export interface ZISSearchOptions {
  query?: string
  construct?: string
  language?: ('de' | 'en')[]
  maxItems?: number
  minAlpha?: number
  keywords?: string[]
}

export interface ZISSearchResult {
  scale: ZISScale
  relevanceScore: number
  matchedOn: string[]
}

export class ZISRepository {
  private static scales = ZIS_SCALES_DATABASE

  /**
   * Search for scales in the ZIS database
   */
  static search(options: ZISSearchOptions): ZISSearchResult[] {
    const results: ZISSearchResult[] = []

    for (const scale of this.scales) {
      const matchedOn: string[] = []
      let relevanceScore = 0

      // Query matching (name, construct, keywords)
      if (options.query) {
        const query = options.query.toLowerCase()

        if (scale.name.toLowerCase().includes(query)) {
          matchedOn.push('name')
          relevanceScore += 10
        }
        if (scale.nameEn?.toLowerCase().includes(query)) {
          matchedOn.push('nameEn')
          relevanceScore += 8
        }
        if (scale.construct.toLowerCase().includes(query)) {
          matchedOn.push('construct')
          relevanceScore += 9
        }
        if (scale.constructEn?.toLowerCase().includes(query)) {
          matchedOn.push('constructEn')
          relevanceScore += 7
        }
        if (scale.keywords.some(k => k.toLowerCase().includes(query))) {
          matchedOn.push('keywords')
          relevanceScore += 5
        }
        if (scale.dimensions?.some(d => d.toLowerCase().includes(query))) {
          matchedOn.push('dimensions')
          relevanceScore += 4
        }
      }

      // Construct matching
      if (options.construct) {
        const construct = options.construct.toLowerCase()
        if (
          scale.construct.toLowerCase().includes(construct) ||
          scale.constructEn?.toLowerCase().includes(construct)
        ) {
          matchedOn.push('construct')
          relevanceScore += 10
        }
      }

      // Language filter
      if (options.language && options.language.length > 0) {
        const hasLanguage = options.language.some(lang => scale.language.includes(lang))
        if (!hasLanguage) continue
        matchedOn.push('language')
        relevanceScore += 2
      }

      // Alpha filter
      if (options.minAlpha && scale.validation.cronbachAlpha) {
        if (scale.validation.cronbachAlpha < options.minAlpha) continue
        matchedOn.push('reliability')
        relevanceScore += 3
      }

      // Keyword matching
      if (options.keywords && options.keywords.length > 0) {
        const matchedKeywords = options.keywords.filter(kw =>
          scale.keywords.some(sk => sk.toLowerCase().includes(kw.toLowerCase()))
        )
        if (matchedKeywords.length > 0) {
          matchedOn.push(`keywords:${matchedKeywords.join(',')}`)
          relevanceScore += matchedKeywords.length * 3
        }
      }

      // Add to results if any match
      if (matchedOn.length > 0 || (!options.query && !options.construct && !options.keywords)) {
        results.push({ scale, relevanceScore, matchedOn })
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Apply limit
    if (options.maxItems) {
      return results.slice(0, options.maxItems)
    }

    return results
  }

  /**
   * Get a scale by ID
   */
  static getById(id: string): ZISScale | undefined {
    return this.scales.find(s => s.id === id)
  }

  /**
   * Get a scale by DOI
   */
  static getByDoi(doi: string): ZISScale | undefined {
    return this.scales.find(s => s.doi === doi)
  }

  /**
   * Get all scales for a construct
   */
  static getByConstruct(construct: string): ZISScale[] {
    const lower = construct.toLowerCase()
    return this.scales.filter(s =>
      s.construct.toLowerCase().includes(lower) ||
      s.constructEn?.toLowerCase().includes(lower)
    )
  }

  /**
   * Get scales by keyword
   */
  static getByKeyword(keyword: string): ZISScale[] {
    const lower = keyword.toLowerCase()
    return this.scales.filter(s =>
      s.keywords.some(k => k.toLowerCase().includes(lower))
    )
  }

  /**
   * Get all available constructs
   */
  static getConstructs(): string[] {
    const constructs = new Set<string>()
    for (const scale of this.scales) {
      constructs.add(scale.construct)
    }
    return Array.from(constructs).sort()
  }

  /**
   * Get all available keywords
   */
  static getKeywords(): string[] {
    const keywords = new Set<string>()
    for (const scale of this.scales) {
      for (const keyword of scale.keywords) {
        keywords.add(keyword)
      }
    }
    return Array.from(keywords).sort()
  }

  /**
   * Convert ZIS scale to internal Scale format
   */
  static toInternalFormat(zisScale: ZISScale): Scale {
    return {
      id: zisScale.id,
      name: zisScale.name,
      authors: zisScale.authors,
      year: zisScale.year,
      doi: zisScale.doi,
      language: zisScale.language,
      construct: zisScale.construct,
      dimensions: zisScale.dimensions?.map((name, i) => ({
        id: `dim_${i}`,
        name,
        definition: '',
        itemIds: [],
      })),
      items: [], // Items must be loaded separately from ZIS
      responseFormat: zisScale.responseFormat,
      validation: {
        cronbachAlpha: zisScale.validation.cronbachAlpha,
        sampleSize: zisScale.validation.sampleSize,
        sampleDescription: zisScale.validation.sampleDescription,
      },
      source: 'zis-gesis',
    }
  }

  /**
   * Generate citation for a scale
   */
  static generateCitation(scale: ZISScale, format: 'apa' | 'mla' = 'apa'): string {
    if (format === 'apa') {
      return scale.citation
    }
    // MLA format could be added here
    return scale.citation
  }

  /**
   * Get ZIS URL for full scale access
   */
  static getScaleUrl(scaleId: string): string {
    const scale = this.getById(scaleId)
    return scale?.zisUrl || `https://zis.gesis.org/skala/${scaleId}`
  }

  /**
   * Suggest scales based on qualitative codes
   */
  static suggestFromCodes(
    codes: { name: string; description?: string }[]
  ): ZISSearchResult[] {
    const allResults: Map<string, ZISSearchResult> = new Map()

    for (const code of codes) {
      // Search by code name
      const nameResults = this.search({ query: code.name, maxItems: 3 })

      // Search by description keywords
      if (code.description) {
        const words = code.description.split(/\s+/).filter(w => w.length > 4)
        for (const word of words.slice(0, 3)) {
          const wordResults = this.search({ query: word, maxItems: 2 })
          nameResults.push(...wordResults)
        }
      }

      // Merge results
      for (const result of nameResults) {
        const existing = allResults.get(result.scale.id)
        if (existing) {
          existing.relevanceScore += result.relevanceScore
          existing.matchedOn.push(...result.matchedOn)
        } else {
          allResults.set(result.scale.id, { ...result })
        }
      }
    }

    // Sort and return top results
    return Array.from(allResults.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10)
  }
}

export default ZISRepository
