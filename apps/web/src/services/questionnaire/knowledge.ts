/**
 * Questionnaire Knowledge Base
 * EVIDENRA Research - Scientific Questionnaire Development System
 *
 * This file contains the scientific knowledge Nexus needs to be a
 * questionnaire development expert. Based on extensive research of:
 * - COSMIN Guidelines (2024)
 * - GESIS/ZIS Standards
 * - Item Response Theory literature
 * - Survey methodology best practices
 *
 * Sources:
 * - PMC IRT: https://pmc.ncbi.nlm.nih.gov/articles/PMC4118016/
 * - COSMIN: https://www.cosmin.nl
 * - ZIS/GESIS: https://zis.gesis.org
 * - Scribbr Likert: https://www.scribbr.com/methodology/likert-scale/
 */

// ============================================================================
// RELIABILITY THRESHOLDS
// ============================================================================

export const RELIABILITY_THRESHOLDS = {
  cronbachAlpha: {
    excellent: 0.90,
    good: 0.80,
    acceptable: 0.70,
    questionable: 0.60,
    poor: 0.50,
    // Note: Alpha > 0.95 may indicate item redundancy
    tooHigh: 0.95,
  },
  mcdonaldOmega: {
    // Same thresholds as alpha, but omega is preferred when
    // tau-equivalence assumption is violated
    excellent: 0.90,
    good: 0.80,
    acceptable: 0.70,
  },
  itemTotalCorrelation: {
    good: 0.50,
    acceptable: 0.30,
    // Items below 0.30 should be reviewed
    problematic: 0.20,
  },
  interItemCorrelation: {
    // Should be between 0.15 and 0.50
    tooLow: 0.15,
    tooHigh: 0.50,
    optimal: { min: 0.20, max: 0.40 },
  },
} as const

// ============================================================================
// VALIDITY THRESHOLDS
// ============================================================================

export const VALIDITY_THRESHOLDS = {
  convergent: {
    // Average Variance Extracted
    ave: 0.50, // AVE > 0.5 indicates convergent validity
    // Composite Reliability
    cr: 0.70,
  },
  discriminant: {
    // Heterotrait-Monotrait Ratio
    htmt: 0.85, // HTMT < 0.85 (conservative: 0.90)
    // For conceptually similar constructs
    htmtRelaxed: 0.90,
  },
  content: {
    // Item-level Content Validity Index
    iCVI: 0.78, // With 6+ experts, I-CVI should be > 0.78
    // Scale-level CVI (average method)
    sCVIAve: 0.80,
    // Scale-level CVI (universal agreement)
    sCVIUA: 0.80,
    // Minimum number of expert reviewers
    minExperts: 5,
    maxExperts: 10,
  },
} as const

// ============================================================================
// MODEL FIT THRESHOLDS (CFA/SEM)
// ============================================================================

export const MODEL_FIT_THRESHOLDS = {
  cfi: {
    excellent: 0.95,
    acceptable: 0.90,
  },
  tli: {
    excellent: 0.95,
    acceptable: 0.90,
  },
  rmsea: {
    excellent: 0.05,
    acceptable: 0.08,
    poor: 0.10,
  },
  srmr: {
    excellent: 0.05,
    acceptable: 0.08,
  },
  // Chi-square should be non-significant, but sensitive to sample size
  // Use chi-square/df ratio instead
  chisqDfRatio: {
    excellent: 2.0,
    acceptable: 3.0,
    poor: 5.0,
  },
} as const

// ============================================================================
// SAMPLE SIZE GUIDELINES
// ============================================================================

export const SAMPLE_SIZE_GUIDELINES = {
  pilot: {
    minimum: 30,
    recommended: 50,
    description: 'For preliminary reliability (Cronbach\'s alpha)',
  },
  efa: {
    minimum: 100,
    recommended: 300,
    subjectToItemRatio: 5, // At least 5:1 subjects per item
    description: 'For exploratory factor analysis',
  },
  cfa: {
    minimum: 200,
    recommended: 300,
    perParameter: 10, // 10 subjects per freely estimated parameter
    description: 'For confirmatory factor analysis',
  },
  irt: {
    minimum: 250,
    recommended: 500,
    forDIF: 200, // Per group for DIF analysis
    description: 'For Item Response Theory analysis',
  },
  contentValidity: {
    experts: { min: 5, max: 10 },
    description: 'Number of expert reviewers for content validity',
  },
  cognitiveInterview: {
    minimum: 5,
    recommended: 10,
    maximum: 15,
    description: 'Participants for cognitive interviewing pretests',
  },
} as const

// ============================================================================
// LIKERT SCALE BEST PRACTICES
// ============================================================================

export const LIKERT_SCALE_GUIDELINES = {
  points: {
    minimum: 4,
    recommended: 5,
    maximum: 7,
    // Don't use 10-point scales - research shows no benefit
    avoid: [10, 11],
  },
  anchors: {
    // Always label all points, not just endpoints
    allLabeled: true,
    // Use balanced scales (equal positive and negative options)
    balanced: true,
    // Include midpoint for attitudes
    includeMidpoint: true,
  },
  order: {
    // Ascending order (1→5) reduces inflation compared to descending
    recommended: 'ascending',
    // Left-to-right progression (negative to positive)
    direction: 'negative-to-positive',
  },
  examples: {
    agreement5: [
      'Stimme überhaupt nicht zu',
      'Stimme eher nicht zu',
      'Weder noch',
      'Stimme eher zu',
      'Stimme voll und ganz zu',
    ],
    agreement7: [
      'Stimme überhaupt nicht zu',
      'Stimme nicht zu',
      'Stimme eher nicht zu',
      'Weder noch',
      'Stimme eher zu',
      'Stimme zu',
      'Stimme voll und ganz zu',
    ],
    frequency5: [
      'Nie',
      'Selten',
      'Manchmal',
      'Oft',
      'Immer',
    ],
    satisfaction5: [
      'Sehr unzufrieden',
      'Eher unzufrieden',
      'Weder noch',
      'Eher zufrieden',
      'Sehr zufrieden',
    ],
  },
} as const

// ============================================================================
// ITEM WRITING RULES
// ============================================================================

export const ITEM_WRITING_RULES = {
  avoid: {
    doubleBarreled: {
      description: 'Items asking about two things at once',
      indicators: [' und ', ' oder ', ' sowie ', ' and ', ' or '],
      example: {
        bad: 'Ich bin mit meiner Arbeit und meinem Gehalt zufrieden.',
        good: ['Ich bin mit meiner Arbeit zufrieden.', 'Ich bin mit meinem Gehalt zufrieden.'],
      },
    },
    leading: {
      description: 'Items suggesting a "correct" answer',
      indicators: ['natürlich', 'offensichtlich', 'selbstverständlich', 'excellent', 'amazing'],
      example: {
        bad: 'Wie ausgezeichnet fanden Sie unseren Service?',
        good: 'Wie bewerten Sie unseren Service?',
      },
    },
    doubleNegative: {
      description: 'Items with two negations',
      indicators: ['nicht un', 'kein un', 'never not', 'not un'],
      example: {
        bad: 'Ich bin nicht unzufrieden mit meiner Arbeit.',
        good: 'Ich bin zufrieden mit meiner Arbeit.',
      },
    },
    hypothetical: {
      description: 'Items asking about imaginary situations',
      indicators: ['wenn Sie', 'falls', 'angenommen', 'if you were', 'suppose'],
    },
    jargon: {
      description: 'Technical terms not understood by target population',
      checkReadability: true,
    },
    absoluteTerms: {
      description: 'Extreme words that rarely apply',
      indicators: ['immer', 'nie', 'alle', 'keiner', 'always', 'never', 'all', 'none'],
    },
  },
  guidelines: {
    length: {
      minimum: 5, // words
      maximum: 20, // words
      optimal: { min: 8, max: 15 },
    },
    format: {
      useFirstPerson: true, // "Ich bin..." instead of "Man ist..."
      avoidPassive: true,
      singleIdea: true,
    },
    reverseItems: {
      // Include some reverse-coded items, but with caution
      recommended: true,
      percentage: { min: 0.2, max: 0.4 }, // 20-40% of items
      warnings: [
        'Reverse items can create method factors',
        'About 10% of respondents answer carelessly',
        'Avoid simple negations; use true opposites',
      ],
    },
  },
} as const

// ============================================================================
// REVERSE CODING GUIDELINES
// ============================================================================

export const REVERSE_CODING_GUIDELINES = {
  purpose: [
    'Detect acquiescence bias (yea-saying)',
    'Reduce careless responding',
    'Improve content coverage',
  ],
  risks: [
    'Can create artificial method factors',
    'Reduces reliability if respondents miss negation',
    'About 10% of respondents answer carelessly to reversed items',
    'Children and low-literacy populations struggle more',
  ],
  bestPractices: [
    'Use true polar opposites, not simple negations',
    'Test with Marlowe-Crowne Social Desirability Scale',
    'Check for method factor in CFA',
    'Consider removing if factor emerges',
  ],
  examples: {
    good: {
      positive: 'Ich fühle mich energiegeladen.',
      negative: 'Ich fühle mich erschöpft.', // True opposite
    },
    bad: {
      positive: 'Ich fühle mich energiegeladen.',
      negative: 'Ich fühle mich NICHT energiegeladen.', // Simple negation
    },
  },
} as const

// ============================================================================
// COSMIN MEASUREMENT PROPERTIES
// ============================================================================

export const COSMIN_PROPERTIES = {
  reliability: {
    internalConsistency: {
      definition: 'Interrelatedness among items',
      metrics: ['Cronbach\'s alpha', 'McDonald\'s omega', 'KR-20'],
      threshold: 0.70,
    },
    reliability: {
      definition: 'Proportion of total variance due to true differences',
      metrics: ['ICC', 'Test-retest correlation'],
      threshold: 0.70,
    },
    measurementError: {
      definition: 'Systematic and random error not attributed to true changes',
      metrics: ['SEM', 'SDC', 'LoA'],
    },
  },
  validity: {
    contentValidity: {
      definition: 'Extent to which content reflects construct',
      aspects: ['relevance', 'comprehensiveness', 'comprehensibility'],
      metrics: ['I-CVI', 'S-CVI'],
    },
    structuralValidity: {
      definition: 'Extent to which scores reflect dimensionality',
      metrics: ['EFA', 'CFA', 'IRT'],
    },
    hypothesesTesting: {
      definition: 'Consistency with hypotheses about relationships',
      types: ['convergent', 'discriminant', 'known-groups'],
    },
    crossCulturalValidity: {
      definition: 'Extent to which translated version reflects original',
      metrics: ['DIF', 'Measurement invariance'],
    },
    criterionValidity: {
      definition: 'Extent to which scores reflect gold standard',
      types: ['concurrent', 'predictive'],
    },
  },
  responsiveness: {
    definition: 'Ability to detect change over time',
    metrics: ['Effect size', 'SRM', 'ROC'],
  },
} as const

// ============================================================================
// COGNITIVE INTERVIEWING PROBES
// ============================================================================

export const COGNITIVE_INTERVIEW_PROBES = {
  comprehension: [
    'Was bedeutet [TERM] für Sie?',
    'Können Sie das in Ihren eigenen Worten wiederholen?',
    'Was glauben Sie, wird mit dieser Frage gemeint?',
    'Gibt es Wörter, die Sie nicht verstehen?',
  ],
  retrieval: [
    'Wie haben Sie sich an diese Information erinnert?',
    'An welchen Zeitraum haben Sie gedacht?',
    'War es schwierig, sich daran zu erinnern?',
    'Haben Sie an bestimmte Situationen gedacht?',
  ],
  judgment: [
    'Wie haben Sie Ihre Antwort entschieden?',
    'War es schwierig, eine Antwort zu wählen?',
    'Haben Sie zwischen Optionen gezögert?',
    'Was hat Ihre Entscheidung beeinflusst?',
  ],
  response: [
    'Warum haben Sie [OPTION] gewählt?',
    'Fehlt eine Antwortoption, die Sie gerne hätten?',
    'Passt Ihre Antwort zu dem, was Sie eigentlich sagen wollten?',
    'Hätten Sie die Frage anders beantwortet, wenn die Optionen anders wären?',
  ],
  general: [
    'Haben Sie Anmerkungen zu dieser Frage?',
    'Wie würden Sie diese Frage verbessern?',
    'War irgendetwas unklar oder verwirrend?',
  ],
} as const

// ============================================================================
// SCALE REPOSITORIES
// ============================================================================

export const SCALE_REPOSITORIES = {
  'zis-gesis': {
    name: 'ZIS - Zusammenstellung sozialwissenschaftlicher Items und Skalen',
    url: 'https://zis.gesis.org',
    language: ['de', 'en'],
    focus: 'Social sciences, psychology, political science',
    access: 'free',
    requiresRegistration: true,
    itemCount: '300+',
    features: ['DOI', 'validation data', 'norms'],
  },
  promis: {
    name: 'PROMIS - Patient-Reported Outcomes Measurement Information System',
    url: 'https://www.healthmeasures.net/explore-measurement-systems/promis',
    language: ['en', 'de', 'es', 'fr', 'many more'],
    focus: 'Health outcomes, patient-reported measures',
    access: 'free',
    requiresRegistration: false,
    itemCount: '300+',
    features: ['CAT', 'IRT calibrated', 'T-scores'],
  },
  psycTests: {
    name: 'PsycTESTS',
    url: 'https://www.apa.org/pubs/databases/psyctests',
    language: ['en'],
    focus: 'Psychological tests and measures',
    access: 'subscription',
    requiresRegistration: true,
    itemCount: '1000+',
    features: ['full text', 'development info'],
  },
  psychologyTools: {
    name: 'Psychology Tools',
    url: 'https://www.psychologytools.com/download-scales-and-measures',
    language: ['en'],
    focus: 'Clinical psychology, therapy',
    access: 'free',
    requiresRegistration: false,
    itemCount: '100+',
    features: ['worksheets', 'measures'],
  },
  pisa: {
    name: 'PISA Questionnaires',
    url: 'https://nces.ed.gov/surveys/pisa/questionnaire.asp',
    language: ['multiple'],
    focus: 'Education, student assessment',
    access: 'free',
    requiresRegistration: false,
    features: ['student', 'school', 'teacher questionnaires'],
  },
  timss: {
    name: 'TIMSS Database',
    url: 'https://timssandpirls.bc.edu/',
    language: ['multiple'],
    focus: 'Mathematics, science education',
    access: 'free',
    requiresRegistration: false,
    features: ['longitudinal', 'cross-cultural'],
  },
} as const

// ============================================================================
// ADAPTATION GUIDELINES
// ============================================================================

export const ADAPTATION_GUIDELINES = {
  steps: [
    {
      name: 'Preparation',
      tasks: [
        'Obtain permission from original authors',
        'Review original validation studies',
        'Identify cultural differences',
      ],
    },
    {
      name: 'Forward Translation',
      tasks: [
        'At least 2 independent translators',
        'Translators should be native in target language',
        'One translator familiar with construct, one naive',
      ],
    },
    {
      name: 'Synthesis',
      tasks: [
        'Compare forward translations',
        'Resolve discrepancies',
        'Create single reconciled version',
      ],
    },
    {
      name: 'Back Translation',
      tasks: [
        'Translate back to source language',
        'Translator should be native in source language',
        'Translator should not know original version',
      ],
    },
    {
      name: 'Expert Committee',
      tasks: [
        'Review all versions',
        'Assess semantic, idiomatic, experiential, conceptual equivalence',
        'Produce pre-final version',
      ],
    },
    {
      name: 'Pretesting',
      tasks: [
        'Cognitive interviews (n=5-10)',
        'Check comprehension',
        'Identify problematic items',
      ],
    },
    {
      name: 'Validation',
      tasks: [
        'Pilot study (n=30-50)',
        'Full validation (n=300+)',
        'Compare psychometric properties to original',
      ],
    },
  ],
  documentation: [
    'Original scale citation',
    'Permission documentation',
    'Translator qualifications',
    'All translation versions',
    'Expert committee decisions',
    'Pretest results',
    'Validation results',
  ],
} as const

// ============================================================================
// EXPORT FORMATS
// ============================================================================

export const EXPORT_FORMATS = {
  ddi: {
    name: 'DDI (Data Documentation Initiative)',
    extension: '.xml',
    standard: true,
    description: 'International standard for social science data',
    url: 'https://ddialliance.org',
  },
  qualtrics: {
    name: 'Qualtrics Survey Format',
    extension: '.qsf',
    description: 'JSON-based format for Qualtrics surveys',
  },
  limesurvey: {
    name: 'LimeSurvey Structure',
    extension: '.lss',
    description: 'XML format for LimeSurvey',
    openSource: true,
  },
  redcap: {
    name: 'REDCap Data Dictionary',
    extension: '.csv',
    description: 'CSV format for REDCap projects',
    focus: 'clinical research',
  },
} as const

// ============================================================================
// NEXUS PROMPTS FOR QUESTIONNAIRE EXPERTISE
// ============================================================================

export const NEXUS_QUESTIONNAIRE_PROMPTS = {
  constructExtraction: `
Analysiere die folgenden qualitativen Codes und Textsegmente.
Identifiziere das zugrundeliegende Konstrukt und seine Dimensionen.

Für jede Dimension:
1. Name und Definition
2. Indikatoren (beobachtbare Verhaltensweisen/Einstellungen)
3. Abgrenzung zu anderen Dimensionen

Prüfe auch, ob bereits validierte Skalen für dieses Konstrukt existieren.
`,

  itemGeneration: `
Generiere Items für das folgende Konstrukt basierend auf den qualitativen Daten.

Regeln:
- Jedes Item misst NUR EIN Konzept (keine Double-Barreled)
- Keine führenden Formulierungen
- Erste Person Singular ("Ich...")
- 8-15 Wörter pro Item
- Mix aus positiv und negativ formulierten Items (80/20)
- Keine Fachbegriffe ohne Erklärung

Für jedes Item:
1. Itemtext
2. Dimension, die es misst
3. Positive oder negative Formulierung
4. Begründung basierend auf den qualitativen Daten
`,

  scaleRecommendation: `
Für das Konstrukt "{construct}" wurden folgende validierte Skalen gefunden:

{scales}

Empfehlung basierend auf:
1. Konzeptuelle Passung zum Forschungskontext
2. Psychometrische Qualität (Reliabilität, Validität)
3. Praktikabilität (Länge, Verfügbarkeit)
4. Zielgruppe

Wenn keine Skala passt, erkläre warum und schlage Adaption oder Neuentwicklung vor.
`,

  itemQualityCheck: `
Prüfe das folgende Item auf Qualitätsprobleme:

"{item}"

Checkliste:
□ Double-Barreled (fragt nach zwei Dingen)?
□ Leading (suggeriert Antwort)?
□ Double-Negative?
□ Zu lang (>20 Wörter)?
□ Zu kurz (<5 Wörter)?
□ Fachbegriffe/Jargon?
□ Hypothetisch?
□ Absolute Begriffe (immer, nie, alle)?

Wenn Probleme gefunden: Verbesserungsvorschlag.
`,

  validationPlan: `
Erstelle einen Validierungsplan für die Skala "{scaleName}" ({itemCount} Items).

Berücksichtige:
1. Stichprobengröße pro Phase
2. Analysen pro Phase
3. Erfolgskriterien
4. Zeitplan

Phasen:
1. Content Validity (Expertenrating)
2. Cognitive Interviews
3. Pilot Study (Reliabilität)
4. Full Validation (EFA, CFA, Validität)
`,

  methodsSection: `
Generiere einen wissenschaftlichen Methodenteil für die Fragebogenvalidierung.

Enthalten sollte:
1. Skalenbeschreibung (Items, Response-Format)
2. Adaptionsprozess (falls adaptiert)
3. Stichprobenbeschreibung
4. Analysemethoden
5. Ergebnisse (Reliabilität, Validität, Faktorstruktur)

Stil: APA 7th Edition, deutsch oder englisch je nach {language}.
`,
} as const
