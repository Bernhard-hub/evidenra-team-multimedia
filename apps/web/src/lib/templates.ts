/**
 * Project Templates for Qualitative Research Methods
 * Pre-defined code sets based on common methodologies
 */

export interface CodeTemplate {
  name: string
  description?: string
  color: string
  children?: CodeTemplate[]
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  methodology: string
  icon: string
  codes: CodeTemplate[]
  suggestedWorkflow?: string[]
}

// Color palette for codes
const colors = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  red: '#ef4444',
  cyan: '#06b6d4',
  pink: '#ec4899',
  yellow: '#eab308',
  indigo: '#6366f1',
  teal: '#14b8a6',
  lime: '#84cc16',
  amber: '#f59e0b',
}

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'grounded-theory',
    name: 'Grounded Theory',
    description: 'Systematische Theoriebildung aus Daten nach Glaser & Strauss',
    methodology: 'Induktive Analyse mit offenem, axialem und selektivem Kodieren',
    icon: 'theory',
    codes: [
      {
        name: 'Offene Codes',
        description: 'Erste, datennahe Konzepte',
        color: colors.blue,
        children: [
          { name: 'Phänomen', description: 'Zentrale Idee oder Ereignis', color: colors.blue },
          { name: 'Bedingung', description: 'Kontext und Ursachen', color: colors.cyan },
          { name: 'Handlung', description: 'Strategien und Interaktionen', color: colors.green },
          { name: 'Konsequenz', description: 'Ergebnisse und Auswirkungen', color: colors.purple },
        ],
      },
      {
        name: 'Axiale Codes',
        description: 'Verbindungen zwischen Kategorien',
        color: colors.purple,
        children: [
          { name: 'Kernkategorie', description: 'Zentrale theoretische Kategorie', color: colors.purple },
          { name: 'Subkategorie', description: 'Untergeordnete Konzepte', color: colors.indigo },
        ],
      },
      {
        name: 'In-Vivo Codes',
        description: 'Wörtliche Ausdrücke der Teilnehmer',
        color: colors.orange,
      },
      {
        name: 'Memos',
        description: 'Theoretische Notizen',
        color: colors.yellow,
      },
    ],
    suggestedWorkflow: [
      'Daten sammeln und erste offene Kodierung',
      'Konzepte und Kategorien entwickeln',
      'Axiales Kodieren: Beziehungen identifizieren',
      'Selektives Kodieren: Kernkategorie herausarbeiten',
      'Theoretische Sättigung überprüfen',
    ],
  },
  {
    id: 'thematic-analysis',
    name: 'Thematische Analyse',
    description: 'Identifikation und Analyse von Themen nach Braun & Clarke',
    methodology: 'Flexible Methode zur Mustererkennung in qualitativen Daten',
    icon: 'themes',
    codes: [
      {
        name: 'Initiale Codes',
        description: 'Erste systematische Kodierung',
        color: colors.blue,
      },
      {
        name: 'Potenzielle Themen',
        description: 'Zusammengefasste Muster',
        color: colors.green,
        children: [
          { name: 'Hauptthema', description: 'Übergeordnetes Thema', color: colors.green },
          { name: 'Subthema', description: 'Untergeordnetes Thema', color: colors.teal },
        ],
      },
      {
        name: 'Semantisch',
        description: 'Explizite, oberflächliche Bedeutungen',
        color: colors.purple,
      },
      {
        name: 'Latent',
        description: 'Implizite, tiefere Bedeutungen',
        color: colors.pink,
      },
      {
        name: 'Interessante Zitate',
        description: 'Aussagekräftige Textstellen',
        color: colors.orange,
      },
    ],
    suggestedWorkflow: [
      'Daten vertraut machen',
      'Initiale Codes generieren',
      'Themen suchen',
      'Themen überprüfen',
      'Themen definieren und benennen',
      'Bericht erstellen',
    ],
  },
  {
    id: 'content-analysis',
    name: 'Inhaltsanalyse',
    description: 'Systematische Textanalyse nach Mayring',
    methodology: 'Regelgeleitete, kategorienbasierte Analyse',
    icon: 'content',
    codes: [
      {
        name: 'Formale Kategorien',
        description: 'Strukturelle Merkmale',
        color: colors.blue,
        children: [
          { name: 'Quelle', description: 'Herkunft des Materials', color: colors.blue },
          { name: 'Zeitpunkt', description: 'Temporale Einordnung', color: colors.cyan },
          { name: 'Format', description: 'Art des Dokuments', color: colors.indigo },
        ],
      },
      {
        name: 'Inhaltliche Kategorien',
        description: 'Thematische Einordnung',
        color: colors.green,
        children: [
          { name: 'Hauptkategorie', description: 'Primäre Themen', color: colors.green },
          { name: 'Unterkategorie', description: 'Sekundäre Themen', color: colors.teal },
        ],
      },
      {
        name: 'Bewertende Kategorien',
        description: 'Einstellungen und Wertungen',
        color: colors.purple,
        children: [
          { name: 'Positiv', description: 'Positive Bewertung', color: colors.green },
          { name: 'Negativ', description: 'Negative Bewertung', color: colors.red },
          { name: 'Neutral', description: 'Neutrale Position', color: colors.yellow },
        ],
      },
      {
        name: 'Ankerbeispiele',
        description: 'Typische Textstellen für Kategorien',
        color: colors.orange,
      },
    ],
    suggestedWorkflow: [
      'Kategoriensystem entwickeln (deduktiv/induktiv)',
      'Kodierregeln definieren',
      'Material kodieren',
      'Reliabilitätsprüfung durchführen',
      'Häufigkeiten und Zusammenhänge analysieren',
    ],
  },
  {
    id: 'phenomenology',
    name: 'Phänomenologische Analyse',
    description: 'Erforschung gelebter Erfahrungen nach Moustakas/van Manen',
    methodology: 'Tiefes Verstehen subjektiver Erlebnisse',
    icon: 'experience',
    codes: [
      {
        name: 'Erlebniselemente',
        description: 'Bestandteile der Erfahrung',
        color: colors.purple,
        children: [
          { name: 'Sinneswahrnehmung', description: 'Was wurde erlebt?', color: colors.purple },
          { name: 'Gefühl', description: 'Emotionale Reaktion', color: colors.pink },
          { name: 'Gedanke', description: 'Kognitive Verarbeitung', color: colors.indigo },
          { name: 'Körperempfindung', description: 'Physische Reaktion', color: colors.teal },
        ],
      },
      {
        name: 'Bedeutungseinheiten',
        description: 'Sinnabschnitte der Erfahrung',
        color: colors.blue,
      },
      {
        name: 'Essentielle Themen',
        description: 'Wesentliche Strukturen der Erfahrung',
        color: colors.green,
      },
      {
        name: 'Horizontalisierung',
        description: 'Gleichwertige erste Aussagen',
        color: colors.orange,
      },
      {
        name: 'Textur',
        description: 'Das "Was" der Erfahrung',
        color: colors.cyan,
      },
      {
        name: 'Struktur',
        description: 'Das "Wie" der Erfahrung',
        color: colors.lime,
      },
    ],
    suggestedWorkflow: [
      'Epoche: Vorurteile ausklammern',
      'Horizontalisierung durchführen',
      'Bedeutungseinheiten identifizieren',
      'Texturale Beschreibung erstellen',
      'Strukturale Beschreibung erstellen',
      'Essenz der Erfahrung formulieren',
    ],
  },
  {
    id: 'narrative-analysis',
    name: 'Narrative Analyse',
    description: 'Analyse von Erzählungen und Lebensgeschichten',
    methodology: 'Verstehen von Erfahrungen durch Geschichten',
    icon: 'story',
    codes: [
      {
        name: 'Narrative Elemente',
        description: 'Bausteine der Erzählung',
        color: colors.blue,
        children: [
          { name: 'Setting', description: 'Ort und Zeit', color: colors.blue },
          { name: 'Charaktere', description: 'Beteiligte Personen', color: colors.cyan },
          { name: 'Plot', description: 'Handlungsverlauf', color: colors.indigo },
          { name: 'Konflikt', description: 'Spannung und Wendepunkt', color: colors.red },
          { name: 'Auflösung', description: 'Ergebnis der Geschichte', color: colors.green },
        ],
      },
      {
        name: 'Erzählperspektive',
        description: 'Blickwinkel des Erzählers',
        color: colors.purple,
      },
      {
        name: 'Wendepunkte',
        description: 'Entscheidende Momente',
        color: colors.orange,
      },
      {
        name: 'Identitätskonstruktion',
        description: 'Selbstdarstellung im Narrativ',
        color: colors.pink,
      },
      {
        name: 'Zeitstruktur',
        description: 'Chronologie der Erzählung',
        color: colors.yellow,
      },
    ],
    suggestedWorkflow: [
      'Narrative sammeln und transkribieren',
      'Erzählstruktur identifizieren',
      'Narrative Elemente kodieren',
      'Wendepunkte und Höhepunkte markieren',
      'Übergreifende Narrative Muster erkennen',
    ],
  },
  {
    id: 'discourse-analysis',
    name: 'Diskursanalyse',
    description: 'Analyse von Sprache und Macht nach Foucault',
    methodology: 'Untersuchung von Sprachgebrauch im sozialen Kontext',
    icon: 'discourse',
    codes: [
      {
        name: 'Sprachliche Mittel',
        description: 'Rhetorik und Stil',
        color: colors.blue,
        children: [
          { name: 'Metapher', description: 'Bildliche Sprache', color: colors.blue },
          { name: 'Rhetorische Figur', description: 'Stilmittel', color: colors.cyan },
          { name: 'Modalität', description: 'Gewissheit/Möglichkeit', color: colors.indigo },
        ],
      },
      {
        name: 'Subjektpositionen',
        description: 'Wie werden Akteure positioniert?',
        color: colors.purple,
      },
      {
        name: 'Machtbeziehungen',
        description: 'Hierarchien und Einfluss',
        color: colors.red,
      },
      {
        name: 'Ideologie',
        description: 'Implizite Wertesysteme',
        color: colors.orange,
      },
      {
        name: 'Interdiskursivität',
        description: 'Bezüge zu anderen Diskursen',
        color: colors.green,
      },
      {
        name: 'Widersprüche',
        description: 'Inkonsistenzen im Diskurs',
        color: colors.yellow,
      },
    ],
    suggestedWorkflow: [
      'Korpus definieren und Material sammeln',
      'Sprachliche Mittel identifizieren',
      'Subjektpositionen analysieren',
      'Machtbeziehungen aufdecken',
      'Ideologische Annahmen freilegen',
    ],
  },
  {
    id: 'empty',
    name: 'Leeres Projekt',
    description: 'Beginnen Sie mit einem leeren Projekt ohne vordefinierte Codes',
    methodology: 'Freie Gestaltung nach eigenen Anforderungen',
    icon: 'empty',
    codes: [],
    suggestedWorkflow: [
      'Forschungsfrage definieren',
      'Material sammeln',
      'Eigenes Kategoriensystem entwickeln',
      'Iterativ kodieren und analysieren',
    ],
  },
]

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): ProjectTemplate | undefined {
  return projectTemplates.find(t => t.id === templateId)
}

/**
 * Flatten template codes to array with parentId references
 */
export function flattenTemplateCodes(
  codes: CodeTemplate[],
  parentId: string | null = null
): Array<{ name: string; description?: string; color: string; parentId: string | null }> {
  const result: Array<{ name: string; description?: string; color: string; parentId: string | null }> = []

  codes.forEach(code => {
    result.push({
      name: code.name,
      description: code.description,
      color: code.color,
      parentId,
    })

    if (code.children) {
      // Use the code name as a temporary ID reference
      const flatChildren = flattenTemplateCodes(code.children, code.name)
      result.push(...flatChildren)
    }
  })

  return result
}

/**
 * Get template icon component name
 */
export const templateIcons: Record<string, string> = {
  theory: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  themes: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  content: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  experience: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  story: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  discourse: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  empty: 'M12 4v16m8-8H4',
}
