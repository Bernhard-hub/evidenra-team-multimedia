/**
 * MethodologyWorkflow - Wissenschaftlich fundierte Methoden-Workflows
 *
 * Quellen:
 * - Mayring, P. (2015): Qualitative Inhaltsanalyse
 * - Strauss, A. & Corbin, J. (1996): Grounded Theory
 * - Braun, V. & Clarke, V. (2006): Thematic Analysis
 * - Moustakas, C. (1994): Phenomenological Research Methods
 * - Riessman, C. K. (2008): Narrative Methods
 * - Kuckartz, U. (2018): Qualitative Inhaltsanalyse
 */

export type MethodologyId =
  | 'grounded-theory'
  | 'content-analysis-mayring'
  | 'thematic-analysis'
  | 'phenomenology'
  | 'narrative-analysis'

export interface WorkflowStep {
  id: string
  name: string
  nameDE: string
  description: string
  descriptionDE: string
  tasks: string[]
  tasksDE: string[]
  outputs: string[]
  outputsDE: string[]
  tips?: string[]
  tipsDE?: string[]
}

export interface Methodology {
  id: MethodologyId
  name: string
  nameDE: string
  description: string
  descriptionDE: string
  authors: string
  year: string
  bestFor: string[]
  bestForDE: string[]
  steps: WorkflowStep[]
}

/**
 * Wissenschaftlich fundierte Methoden-Definitionen
 */
export const METHODOLOGIES: Record<MethodologyId, Methodology> = {

  'grounded-theory': {
    id: 'grounded-theory',
    name: 'Grounded Theory',
    nameDE: 'Grounded Theory',
    description: 'Systematic theory development from data through constant comparison',
    descriptionDE: 'Systematische Theorieentwicklung aus Daten durch konstanten Vergleich',
    authors: 'Glaser & Strauss (1967), Strauss & Corbin (1996)',
    year: '1967/1996',
    bestFor: ['Theory development', 'Process analysis', 'Social phenomena'],
    bestForDE: ['Theorieentwicklung', 'Prozessanalyse', 'Soziale Phänomene'],
    steps: [
      {
        id: 'open-coding',
        name: 'Open Coding',
        nameDE: 'Offenes Kodieren',
        description: 'Break down data into discrete concepts and categories',
        descriptionDE: 'Daten in diskrete Konzepte und Kategorien aufbrechen',
        tasks: [
          'Read data line by line',
          'Identify concepts and phenomena',
          'Create initial codes (in-vivo or constructed)',
          'Write memos about emerging ideas'
        ],
        tasksDE: [
          'Daten Zeile für Zeile lesen',
          'Konzepte und Phänomene identifizieren',
          'Initiale Codes erstellen (in-vivo oder konstruiert)',
          'Memos über entstehende Ideen schreiben'
        ],
        outputs: ['Initial code list', 'First memos', 'Conceptual notes'],
        outputsDE: ['Initiale Code-Liste', 'Erste Memos', 'Konzeptuelle Notizen'],
        tips: ['Stay close to the data', 'Use gerunds for action codes', 'Ask: What is happening here?'],
        tipsDE: ['Nah an den Daten bleiben', 'Gerundien für Handlungscodes nutzen', 'Frage: Was passiert hier?']
      },
      {
        id: 'axial-coding',
        name: 'Axial Coding',
        nameDE: 'Axiales Kodieren',
        description: 'Relate categories to subcategories using the paradigm model',
        descriptionDE: 'Kategorien mit Subkategorien über das Paradigmenmodell verbinden',
        tasks: [
          'Identify relationships between categories',
          'Apply paradigm model (conditions, actions, consequences)',
          'Develop category dimensions and properties',
          'Refine and consolidate codes'
        ],
        tasksDE: [
          'Beziehungen zwischen Kategorien identifizieren',
          'Paradigmenmodell anwenden (Bedingungen, Handlungen, Konsequenzen)',
          'Kategoriendimensionen und -eigenschaften entwickeln',
          'Codes verfeinern und konsolidieren'
        ],
        outputs: ['Category relationships', 'Paradigm model diagrams', 'Refined categories'],
        outputsDE: ['Kategorienbeziehungen', 'Paradigmenmodell-Diagramme', 'Verfeinerte Kategorien'],
        tips: ['Look for causal conditions', 'Consider context', 'Identify strategies actors use'],
        tipsDE: ['Nach kausalen Bedingungen suchen', 'Kontext berücksichtigen', 'Strategien der Akteure identifizieren']
      },
      {
        id: 'selective-coding',
        name: 'Selective Coding',
        nameDE: 'Selektives Kodieren',
        description: 'Identify and develop the core category that integrates the theory',
        descriptionDE: 'Kernkategorie identifizieren und entwickeln, die die Theorie integriert',
        tasks: [
          'Identify the core category',
          'Relate all categories to the core',
          'Fill in gaps in the theory',
          'Validate the emerging theory'
        ],
        tasksDE: [
          'Kernkategorie identifizieren',
          'Alle Kategorien zur Kernkategorie in Beziehung setzen',
          'Lücken in der Theorie füllen',
          'Entstehende Theorie validieren'
        ],
        outputs: ['Core category', 'Integrated theory', 'Storyline'],
        outputsDE: ['Kernkategorie', 'Integrierte Theorie', 'Storyline'],
        tips: ['The core category should explain most variation', 'Write the storyline', 'Check theoretical saturation'],
        tipsDE: ['Kernkategorie sollte meiste Variation erklären', 'Storyline schreiben', 'Theoretische Sättigung prüfen']
      },
      {
        id: 'theory-integration',
        name: 'Theory Integration',
        nameDE: 'Theorieintegration',
        description: 'Integrate findings into a coherent theoretical framework',
        descriptionDE: 'Befunde in ein kohärentes theoretisches Framework integrieren',
        tasks: [
          'Write theoretical narrative',
          'Create visual model of theory',
          'Compare with existing literature',
          'Identify scope and limitations'
        ],
        tasksDE: [
          'Theoretisches Narrativ schreiben',
          'Visuelles Modell der Theorie erstellen',
          'Mit bestehender Literatur vergleichen',
          'Reichweite und Limitationen identifizieren'
        ],
        outputs: ['Grounded theory', 'Theoretical model', 'Research report'],
        outputsDE: ['Gegenstandsbezogene Theorie', 'Theoretisches Modell', 'Forschungsbericht']
      }
    ]
  },

  'content-analysis-mayring': {
    id: 'content-analysis-mayring',
    name: 'Qualitative Content Analysis',
    nameDE: 'Qualitative Inhaltsanalyse',
    description: 'Systematic, rule-guided text analysis with category system',
    descriptionDE: 'Systematische, regelgeleitete Textanalyse mit Kategoriensystem',
    authors: 'Mayring (2015), Kuckartz (2018)',
    year: '2015/2018',
    bestFor: ['Structured analysis', 'Interview analysis', 'Document analysis'],
    bestForDE: ['Strukturierte Analyse', 'Interviewanalyse', 'Dokumentenanalyse'],
    steps: [
      {
        id: 'material-preparation',
        name: 'Material Preparation',
        nameDE: 'Materialaufbereitung',
        description: 'Prepare and structure the text corpus',
        descriptionDE: 'Textkorpus aufbereiten und strukturieren',
        tasks: [
          'Define analysis units (coding, context, evaluation unit)',
          'Transcribe if necessary',
          'Anonymize sensitive data',
          'Document material characteristics'
        ],
        tasksDE: [
          'Analyseeinheiten festlegen (Kodier-, Kontext-, Auswertungseinheit)',
          'Falls nötig transkribieren',
          'Sensible Daten anonymisieren',
          'Materialcharakteristika dokumentieren'
        ],
        outputs: ['Prepared corpus', 'Analysis protocol', 'Material overview'],
        outputsDE: ['Aufbereiteter Korpus', 'Analyseprotokoll', 'Materialübersicht']
      },
      {
        id: 'category-development',
        name: 'Category Development',
        nameDE: 'Kategorienentwicklung',
        description: 'Develop category system (deductive, inductive, or mixed)',
        descriptionDE: 'Kategoriensystem entwickeln (deduktiv, induktiv oder gemischt)',
        tasks: [
          'Decide on deductive/inductive approach',
          'Define categories with clear definitions',
          'Create anchor examples for each category',
          'Establish coding rules'
        ],
        tasksDE: [
          'Über deduktiven/induktiven Ansatz entscheiden',
          'Kategorien mit klaren Definitionen erstellen',
          'Ankerbeispiele für jede Kategorie erstellen',
          'Kodierregeln festlegen'
        ],
        outputs: ['Category system', 'Coding guide', 'Anchor examples'],
        outputsDE: ['Kategoriensystem', 'Kodierleitfaden', 'Ankerbeispiele'],
        tips: ['Categories should be mutually exclusive', 'Definitions must be clear and unambiguous'],
        tipsDE: ['Kategorien sollten sich gegenseitig ausschließen', 'Definitionen müssen klar und eindeutig sein']
      },
      {
        id: 'coding-process',
        name: 'Coding Process',
        nameDE: 'Kodierprozess',
        description: 'Systematically apply categories to material',
        descriptionDE: 'Kategorien systematisch auf Material anwenden',
        tasks: [
          'Code material sequentially',
          'Apply coding rules consistently',
          'Document difficult cases',
          'Revise categories if needed (in inductive phase)'
        ],
        tasksDE: [
          'Material sequentiell kodieren',
          'Kodierregeln konsistent anwenden',
          'Schwierige Fälle dokumentieren',
          'Kategorien bei Bedarf revidieren (in induktiver Phase)'
        ],
        outputs: ['Coded material', 'Coding documentation', 'Revised category system'],
        outputsDE: ['Kodiertes Material', 'Kodierdokumentation', 'Revidiertes Kategoriensystem']
      },
      {
        id: 'reliability-check',
        name: 'Reliability Check',
        nameDE: 'Reliabilitätsprüfung',
        description: 'Verify inter-coder reliability',
        descriptionDE: 'Intercoder-Reliabilität prüfen',
        tasks: [
          'Select sample for reliability check',
          'Have second coder code independently',
          'Calculate agreement (Cohen\'s Kappa or similar)',
          'Discuss and resolve discrepancies'
        ],
        tasksDE: [
          'Stichprobe für Reliabilitätsprüfung auswählen',
          'Zweiten Kodierer unabhängig kodieren lassen',
          'Übereinstimmung berechnen (Cohen\'s Kappa o.ä.)',
          'Diskrepanzen diskutieren und auflösen'
        ],
        outputs: ['Reliability score', 'Discrepancy analysis', 'Final category system'],
        outputsDE: ['Reliabilitätswert', 'Diskrepanzanalyse', 'Finales Kategoriensystem']
      },
      {
        id: 'analysis-interpretation',
        name: 'Analysis & Interpretation',
        nameDE: 'Analyse & Interpretation',
        description: 'Analyze coded material and interpret results',
        descriptionDE: 'Kodiertes Material analysieren und Ergebnisse interpretieren',
        tasks: [
          'Calculate frequencies and distributions',
          'Analyze category patterns',
          'Interpret in context of research questions',
          'Compare with existing research'
        ],
        tasksDE: [
          'Häufigkeiten und Verteilungen berechnen',
          'Kategorienmuster analysieren',
          'Im Kontext der Forschungsfragen interpretieren',
          'Mit bestehender Forschung vergleichen'
        ],
        outputs: ['Frequency tables', 'Pattern analysis', 'Research report'],
        outputsDE: ['Häufigkeitstabellen', 'Musteranalyse', 'Forschungsbericht']
      }
    ]
  },

  'thematic-analysis': {
    id: 'thematic-analysis',
    name: 'Thematic Analysis',
    nameDE: 'Thematische Analyse',
    description: 'Identify, analyze and report patterns (themes) in data',
    descriptionDE: 'Muster (Themen) in Daten identifizieren, analysieren und berichten',
    authors: 'Braun & Clarke (2006, 2019)',
    year: '2006/2019',
    bestFor: ['Flexible analysis', 'Pattern identification', 'Accessible method'],
    bestForDE: ['Flexible Analyse', 'Musteridentifikation', 'Zugängliche Methode'],
    steps: [
      {
        id: 'familiarization',
        name: 'Familiarization',
        nameDE: 'Vertrautmachen',
        description: 'Immerse yourself in the data',
        descriptionDE: 'Sich in die Daten vertiefen',
        tasks: [
          'Read and re-read data',
          'Note initial ideas',
          'Transcribe if necessary',
          'Check transcription accuracy'
        ],
        tasksDE: [
          'Daten mehrfach lesen',
          'Erste Ideen notieren',
          'Falls nötig transkribieren',
          'Transkriptionsgenauigkeit prüfen'
        ],
        outputs: ['Familiarization notes', 'Initial observations'],
        outputsDE: ['Notizen zur Vertrautmachung', 'Erste Beobachtungen']
      },
      {
        id: 'initial-coding',
        name: 'Generating Initial Codes',
        nameDE: 'Initiale Codes generieren',
        description: 'Code interesting features systematically',
        descriptionDE: 'Interessante Merkmale systematisch kodieren',
        tasks: [
          'Code for as many patterns as possible',
          'Code extracts inclusively (keep context)',
          'Create both semantic and latent codes',
          'Collate data for each code'
        ],
        tasksDE: [
          'So viele Muster wie möglich kodieren',
          'Auszüge inklusiv kodieren (Kontext behalten)',
          'Sowohl semantische als auch latente Codes erstellen',
          'Daten für jeden Code zusammenstellen'
        ],
        outputs: ['Initial codes', 'Coded dataset', 'Code descriptions'],
        outputsDE: ['Initiale Codes', 'Kodierter Datensatz', 'Code-Beschreibungen'],
        tips: ['Code for as many patterns as possible', 'Both semantic and latent coding'],
        tipsDE: ['So viele Muster wie möglich kodieren', 'Sowohl semantisch als auch latent kodieren']
      },
      {
        id: 'searching-themes',
        name: 'Searching for Themes',
        nameDE: 'Themensuche',
        description: 'Collate codes into potential themes',
        descriptionDE: 'Codes zu potenziellen Themen zusammenfassen',
        tasks: [
          'Collate codes into potential themes',
          'Create thematic map',
          'Consider how codes combine',
          'Identify candidate themes and sub-themes'
        ],
        tasksDE: [
          'Codes zu potenziellen Themen zusammenfassen',
          'Thematische Karte erstellen',
          'Überlegen wie Codes sich verbinden',
          'Kandidaten für Themen und Unterthemen identifizieren'
        ],
        outputs: ['Candidate themes', 'Thematic map', 'Theme hierarchy'],
        outputsDE: ['Themenkandidaten', 'Thematische Karte', 'Themenhierarchie']
      },
      {
        id: 'reviewing-themes',
        name: 'Reviewing Themes',
        nameDE: 'Themen überprüfen',
        description: 'Check themes against coded extracts and entire dataset',
        descriptionDE: 'Themen gegen kodierte Auszüge und gesamten Datensatz prüfen',
        tasks: [
          'Review themes against coded extracts',
          'Review themes against entire dataset',
          'Refine, split, or combine themes',
          'Ensure internal homogeneity and external heterogeneity'
        ],
        tasksDE: [
          'Themen gegen kodierte Auszüge prüfen',
          'Themen gegen gesamten Datensatz prüfen',
          'Themen verfeinern, aufteilen oder zusammenfassen',
          'Interne Homogenität und externe Heterogenität sicherstellen'
        ],
        outputs: ['Refined themes', 'Revised thematic map'],
        outputsDE: ['Verfeinerte Themen', 'Revidierte thematische Karte']
      },
      {
        id: 'defining-themes',
        name: 'Defining and Naming Themes',
        nameDE: 'Themen definieren und benennen',
        description: 'Define the essence and scope of each theme',
        descriptionDE: 'Essenz und Reichweite jedes Themas definieren',
        tasks: [
          'Write detailed analysis for each theme',
          'Identify the story each theme tells',
          'Create concise, punchy theme names',
          'Define theme boundaries'
        ],
        tasksDE: [
          'Detaillierte Analyse für jedes Thema schreiben',
          'Die Geschichte identifizieren, die jedes Thema erzählt',
          'Prägnante Themennamen erstellen',
          'Themengrenzen definieren'
        ],
        outputs: ['Theme definitions', 'Theme narratives', 'Final theme names'],
        outputsDE: ['Themendefinitionen', 'Themennarrative', 'Finale Themennamen']
      },
      {
        id: 'producing-report',
        name: 'Producing the Report',
        nameDE: 'Bericht erstellen',
        description: 'Final analysis and write-up',
        descriptionDE: 'Finale Analyse und Verschriftlichung',
        tasks: [
          'Select compelling extract examples',
          'Relate analysis to research question',
          'Embed analysis in existing literature',
          'Write coherent analytical narrative'
        ],
        tasksDE: [
          'Überzeugende Auszugsbeispiele auswählen',
          'Analyse mit Forschungsfrage verbinden',
          'Analyse in bestehende Literatur einbetten',
          'Kohärentes analytisches Narrativ schreiben'
        ],
        outputs: ['Research report', 'Theme summary', 'Final analysis'],
        outputsDE: ['Forschungsbericht', 'Themenzusammenfassung', 'Finale Analyse']
      }
    ]
  },

  'phenomenology': {
    id: 'phenomenology',
    name: 'Phenomenological Analysis',
    nameDE: 'Phänomenologische Analyse',
    description: 'Understand the essence of lived experiences',
    descriptionDE: 'Das Wesen gelebter Erfahrungen verstehen',
    authors: 'Moustakas (1994), van Manen (1990)',
    year: '1990/1994',
    bestFor: ['Lived experience', 'Meaning understanding', 'Essence description'],
    bestForDE: ['Gelebte Erfahrung', 'Bedeutungsverstehen', 'Essenzbeschreibung'],
    steps: [
      {
        id: 'epoche',
        name: 'Epoché (Bracketing)',
        nameDE: 'Epoché (Einklammerung)',
        description: 'Suspend preconceptions and biases',
        descriptionDE: 'Vorannahmen und Vorurteile suspendieren',
        tasks: [
          'Identify personal assumptions about phenomenon',
          'Write reflexivity statement',
          'Document prior knowledge and experiences',
          'Commit to approaching data with fresh eyes'
        ],
        tasksDE: [
          'Persönliche Annahmen zum Phänomen identifizieren',
          'Reflexivitätsstatement schreiben',
          'Vorwissen und Erfahrungen dokumentieren',
          'Sich verpflichten, Daten unvoreingenommen zu betrachten'
        ],
        outputs: ['Reflexivity statement', 'Bracketing notes', 'Assumption list'],
        outputsDE: ['Reflexivitätsstatement', 'Einklammerungsnotizen', 'Annahmenliste']
      },
      {
        id: 'horizonalization',
        name: 'Horizonalization',
        nameDE: 'Horizontalisierung',
        description: 'List all significant statements with equal value',
        descriptionDE: 'Alle bedeutsamen Aussagen gleichwertig auflisten',
        tasks: [
          'Identify all statements about the experience',
          'Treat each statement with equal value',
          'List significant statements',
          'Remove repetitions and overlaps'
        ],
        tasksDE: [
          'Alle Aussagen zur Erfahrung identifizieren',
          'Jede Aussage gleichwertig behandeln',
          'Bedeutsame Aussagen auflisten',
          'Wiederholungen und Überlappungen entfernen'
        ],
        outputs: ['List of significant statements', 'Horizon of experience'],
        outputsDE: ['Liste bedeutsamer Aussagen', 'Erfahrungshorizont']
      },
      {
        id: 'meaning-units',
        name: 'Meaning Units / Clusters',
        nameDE: 'Bedeutungseinheiten / Cluster',
        description: 'Cluster statements into themes of meaning',
        descriptionDE: 'Aussagen zu Bedeutungsthemen clustern',
        tasks: [
          'Group significant statements into clusters',
          'Identify core themes of experience',
          'Name each meaning cluster',
          'Verify clusters against original data'
        ],
        tasksDE: [
          'Bedeutsame Aussagen zu Clustern gruppieren',
          'Kernthemen der Erfahrung identifizieren',
          'Jeden Bedeutungscluster benennen',
          'Cluster gegen Originaldaten verifizieren'
        ],
        outputs: ['Meaning clusters', 'Theme descriptions'],
        outputsDE: ['Bedeutungscluster', 'Themenbeschreibungen']
      },
      {
        id: 'textural-description',
        name: 'Textural Description',
        nameDE: 'Texturale Beschreibung',
        description: 'Describe WHAT was experienced',
        descriptionDE: 'Beschreiben WAS erfahren wurde',
        tasks: [
          'Write description of what participants experienced',
          'Use verbatim quotes',
          'Describe the texture of the experience',
          'Focus on the noematic content'
        ],
        tasksDE: [
          'Beschreibung dessen schreiben, was Teilnehmer erfahren haben',
          'Wörtliche Zitate verwenden',
          'Die Textur der Erfahrung beschreiben',
          'Auf noematischen Inhalt fokussieren'
        ],
        outputs: ['Textural description', 'What of experience'],
        outputsDE: ['Texturale Beschreibung', 'Das Was der Erfahrung']
      },
      {
        id: 'structural-description',
        name: 'Structural Description',
        nameDE: 'Strukturale Beschreibung',
        description: 'Describe HOW the experience was experienced',
        descriptionDE: 'Beschreiben WIE die Erfahrung erfahren wurde',
        tasks: [
          'Describe the underlying structures',
          'Identify conditions and context',
          'Describe how the phenomenon was experienced',
          'Focus on the noetic process'
        ],
        tasksDE: [
          'Zugrunde liegende Strukturen beschreiben',
          'Bedingungen und Kontext identifizieren',
          'Beschreiben wie das Phänomen erfahren wurde',
          'Auf noetischen Prozess fokussieren'
        ],
        outputs: ['Structural description', 'How of experience'],
        outputsDE: ['Strukturale Beschreibung', 'Das Wie der Erfahrung']
      },
      {
        id: 'essence-synthesis',
        name: 'Essence Synthesis',
        nameDE: 'Essenzsynthese',
        description: 'Synthesize textural and structural descriptions into essence',
        descriptionDE: 'Texturale und strukturale Beschreibungen zur Essenz synthetisieren',
        tasks: [
          'Integrate textural and structural descriptions',
          'Identify the invariant essence',
          'Write composite description of the phenomenon',
          'Describe universal essence of the experience'
        ],
        tasksDE: [
          'Texturale und strukturale Beschreibungen integrieren',
          'Invariante Essenz identifizieren',
          'Zusammengesetzte Beschreibung des Phänomens schreiben',
          'Universelle Essenz der Erfahrung beschreiben'
        ],
        outputs: ['Essence description', 'Composite textural-structural description'],
        outputsDE: ['Essenzbeschreibung', 'Zusammengesetzte texturale-strukturale Beschreibung']
      }
    ]
  },

  'narrative-analysis': {
    id: 'narrative-analysis',
    name: 'Narrative Analysis',
    nameDE: 'Narrative Analyse',
    description: 'Analyze stories, their structure, and meaning',
    descriptionDE: 'Geschichten, ihre Struktur und Bedeutung analysieren',
    authors: 'Riessman (2008), Labov & Waletzky (1967)',
    year: '1967/2008',
    bestFor: ['Life stories', 'Identity research', 'Temporal processes'],
    bestForDE: ['Lebensgeschichten', 'Identitätsforschung', 'Zeitliche Prozesse'],
    steps: [
      {
        id: 'narrative-identification',
        name: 'Narrative Identification',
        nameDE: 'Narrativ-Identifikation',
        description: 'Identify and bound narrative segments',
        descriptionDE: 'Narrative Segmente identifizieren und abgrenzen',
        tasks: [
          'Identify story beginnings and endings',
          'Mark distinct narrative units',
          'Note temporal markers',
          'Distinguish stories from other talk'
        ],
        tasksDE: [
          'Geschichtenanfänge und -enden identifizieren',
          'Unterschiedliche narrative Einheiten markieren',
          'Zeitliche Marker notieren',
          'Geschichten von anderem Sprechen unterscheiden'
        ],
        outputs: ['Identified narratives', 'Narrative boundaries', 'Temporal mapping'],
        outputsDE: ['Identifizierte Narrative', 'Narrative Grenzen', 'Zeitliche Kartierung']
      },
      {
        id: 'structural-analysis',
        name: 'Structural Analysis',
        nameDE: 'Strukturanalyse',
        description: 'Analyze narrative structure using Labov model',
        descriptionDE: 'Narrative Struktur nach Labov-Modell analysieren',
        tasks: [
          'Identify abstract (summary)',
          'Mark orientation (who, when, where)',
          'Find complicating action (what happened)',
          'Locate evaluation (significance)',
          'Identify resolution and coda'
        ],
        tasksDE: [
          'Abstract (Zusammenfassung) identifizieren',
          'Orientierung markieren (wer, wann, wo)',
          'Komplizierende Handlung finden (was passierte)',
          'Evaluation lokalisieren (Bedeutung)',
          'Auflösung und Coda identifizieren'
        ],
        outputs: ['Structural analysis', 'Labov coding', 'Narrative elements'],
        outputsDE: ['Strukturanalyse', 'Labov-Kodierung', 'Narrative Elemente']
      },
      {
        id: 'content-analysis',
        name: 'Thematic/Content Analysis',
        nameDE: 'Thematische/Inhaltsanalyse',
        description: 'Analyze what the narrative is about',
        descriptionDE: 'Analysieren worum es im Narrativ geht',
        tasks: [
          'Identify central themes',
          'Analyze character representations',
          'Examine plot progression',
          'Note recurring motifs'
        ],
        tasksDE: [
          'Zentrale Themen identifizieren',
          'Charakterdarstellungen analysieren',
          'Plotentwicklung untersuchen',
          'Wiederkehrende Motive notieren'
        ],
        outputs: ['Theme analysis', 'Character analysis', 'Plot analysis'],
        outputsDE: ['Themenanalyse', 'Charakteranalyse', 'Plotanalyse']
      },
      {
        id: 'performative-analysis',
        name: 'Performative Analysis',
        nameDE: 'Performative Analyse',
        description: 'Analyze how the story is told and to what effect',
        descriptionDE: 'Analysieren wie die Geschichte erzählt wird und mit welcher Wirkung',
        tasks: [
          'Analyze storytelling style',
          'Consider audience and context',
          'Examine identity work in narrative',
          'Note linguistic and rhetorical devices'
        ],
        tasksDE: [
          'Erzählstil analysieren',
          'Publikum und Kontext berücksichtigen',
          'Identitätsarbeit im Narrativ untersuchen',
          'Sprachliche und rhetorische Mittel notieren'
        ],
        outputs: ['Performance analysis', 'Identity analysis', 'Rhetorical analysis'],
        outputsDE: ['Performanzanalyse', 'Identitätsanalyse', 'Rhetorische Analyse']
      },
      {
        id: 'synthesis',
        name: 'Synthesis & Interpretation',
        nameDE: 'Synthese & Interpretation',
        description: 'Integrate analyses into coherent interpretation',
        descriptionDE: 'Analysen in kohärente Interpretation integrieren',
        tasks: [
          'Integrate structural, content, and performative analyses',
          'Develop overarching interpretation',
          'Connect to research questions',
          'Situate in broader context'
        ],
        tasksDE: [
          'Strukturelle, inhaltliche und performative Analysen integrieren',
          'Übergreifende Interpretation entwickeln',
          'Mit Forschungsfragen verbinden',
          'In breiteren Kontext einordnen'
        ],
        outputs: ['Integrated interpretation', 'Research findings', 'Narrative report'],
        outputsDE: ['Integrierte Interpretation', 'Forschungsbefunde', 'Narrativer Bericht']
      }
    ]
  }
}

/**
 * Get methodology by ID
 */
export function getMethodology(id: MethodologyId): Methodology {
  return METHODOLOGIES[id]
}

/**
 * Get all methodologies
 */
export function getAllMethodologies(): Methodology[] {
  return Object.values(METHODOLOGIES)
}

/**
 * Get step by methodology and step ID
 */
export function getStep(methodologyId: MethodologyId, stepId: string): WorkflowStep | undefined {
  const methodology = METHODOLOGIES[methodologyId]
  return methodology?.steps.find(s => s.id === stepId)
}

export default METHODOLOGIES
