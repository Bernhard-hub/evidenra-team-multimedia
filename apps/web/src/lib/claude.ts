/**
 * Claude API Client for EVIDENRA
 * Handles all AI coding requests
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeResponse {
  id: string
  content: { type: 'text'; text: string }[]
  model: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export interface CodingResult {
  codings: {
    codeName: string
    codeDescription?: string
    selectedText: string
    startOffset: number
    endOffset: number
    reasoning: string
    confidence: number
  }[]
  suggestedCodes: {
    name: string
    description: string
    color: string
  }[]
  summary: string
}

class ClaudeClient {
  private apiKey: string | null = null

  setApiKey(key: string) {
    this.apiKey = key
    localStorage.setItem('claude-api-key', key)
  }

  getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('claude-api-key')
    }
    return this.apiKey
  }

  clearApiKey() {
    this.apiKey = null
    localStorage.removeItem('claude-api-key')
  }

  hasApiKey(): boolean {
    return !!this.getApiKey()
  }

  async sendMessage(
    messages: ClaudeMessage[],
    system?: string,
    options?: {
      model?: string
      maxTokens?: number
      temperature?: number
    }
  ): Promise<ClaudeResponse> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('Claude API-Schlüssel nicht konfiguriert')
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: options?.model || DEFAULT_MODEL,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.3,
        system: system,
        messages: messages,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `API-Fehler: ${response.status}`)
    }

    return response.json()
  }
}

export const claude = new ClaudeClient()

// ============================================
// CODING PROMPTS
// ============================================

const CODING_SYSTEM_PROMPT = `Du bist ein Experte für qualitative Datenanalyse und Kodierung. Du analysierst Texte nach wissenschaftlichen Standards der qualitativen Forschung.

WICHTIGE REGELN:
1. Kodiere nur relevante Textstellen, nicht den gesamten Text
2. Jede Kodierung muss eine klare Begründung haben
3. Verwende prägnante, aussagekräftige Code-Namen
4. Beachte den Kontext der Aussagen
5. Identifiziere sowohl manifeste als auch latente Bedeutungen

Antworte IMMER im folgenden JSON-Format:
{
  "codings": [
    {
      "codeName": "Name des Codes",
      "codeDescription": "Kurze Beschreibung",
      "selectedText": "Exakter Text aus dem Dokument",
      "reasoning": "Begründung für diese Kodierung",
      "confidence": 0.85
    }
  ],
  "suggestedCodes": [
    {
      "name": "Code-Name",
      "description": "Beschreibung",
      "color": "#hexcolor"
    }
  ],
  "summary": "Kurze Zusammenfassung der Analyse"
}`

// ============================================
// CODING METHODS
// ============================================

export type CodingMethod = 'dynamic-personas' | 'three-expert' | 'calibrated-pattern' | 'ultra-turbo'

interface ExistingCode {
  name: string
  description?: string
  color: string
}

export async function runAICoding(
  documentContent: string,
  method: CodingMethod,
  existingCodes: ExistingCode[] = [],
  onProgress?: (progress: number, status: string) => void
): Promise<CodingResult> {
  switch (method) {
    case 'dynamic-personas':
      return runDynamicPersonasCoding(documentContent, existingCodes, onProgress)
    case 'three-expert':
      return runThreeExpertCoding(documentContent, existingCodes, onProgress)
    case 'calibrated-pattern':
      return runCalibratedPatternCoding(documentContent, existingCodes, onProgress)
    case 'ultra-turbo':
      return runUltraTurboCoding(documentContent, existingCodes, onProgress)
    default:
      throw new Error(`Unbekannte Kodierungsmethode: ${method}`)
  }
}

// ============================================
// DYNAMIC PERSONAS
// ============================================

async function runDynamicPersonasCoding(
  content: string,
  existingCodes: ExistingCode[],
  onProgress?: (progress: number, status: string) => void
): Promise<CodingResult> {
  onProgress?.(10, 'Analysiere Dokumenttyp...')

  // Detect content type
  const contentType = detectContentType(content)

  const personas = [
    {
      name: 'Domain-Experte',
      prompt: `Du bist ein ${contentType === 'interview' ? 'erfahrener Interviewforscher' : 'qualitativer Forscher'}.
Fokussiere auf tieferliegende Bedeutungen, Emotionen und implizite Annahmen.`,
    },
    {
      name: 'Methodenexperte',
      prompt: `Du bist ein Methodenexperte für qualitative Forschung.
Achte auf konsistente Kodierung, klare Abgrenzungen und methodische Stringenz.`,
    },
    {
      name: 'Kritischer Analyst',
      prompt: `Du bist ein kritischer Analyst.
Hinterfrage offensichtliche Interpretationen, suche nach Widersprüchen und alternativen Lesarten.`,
    },
  ]

  const allCodings: CodingResult['codings'] = []
  const allSuggestedCodes: CodingResult['suggestedCodes'] = []

  // Run each persona
  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i]
    onProgress?.(20 + i * 25, `${persona.name} analysiert...`)

    const result = await runSinglePersonaCoding(content, persona.prompt, existingCodes)
    allCodings.push(...result.codings)
    allSuggestedCodes.push(...result.suggestedCodes)
  }

  onProgress?.(90, 'Konsens berechnen...')

  // Find consensus (codings that appear in multiple personas)
  const consensusCodings = findConsensusCodings(allCodings)
  const mergedCodes = mergeSuggestedCodes(allSuggestedCodes)

  onProgress?.(100, 'Fertig!')

  return {
    codings: consensusCodings,
    suggestedCodes: mergedCodes,
    summary: `Dynamic Personas Analyse: ${consensusCodings.length} Kodierungen mit Konsens von ${personas.length} Perspektiven.`,
  }
}

// ============================================
// THREE EXPERT SYSTEM
// ============================================

async function runThreeExpertCoding(
  content: string,
  existingCodes: ExistingCode[],
  onProgress?: (progress: number, status: string) => void
): Promise<CodingResult> {
  onProgress?.(10, 'Initialisiere Experten...')

  const experts = [
    { name: 'Experte 1', temperature: 0.3 },
    { name: 'Experte 2', temperature: 0.4 },
    { name: 'Experte 3', temperature: 0.5 },
  ]

  const allCodings: CodingResult['codings'][] = []

  // Each expert codes independently
  for (let i = 0; i < experts.length; i++) {
    const expert = experts[i]
    onProgress?.(15 + i * 25, `${expert.name} kodiert unabhängig...`)

    const prompt = `Du bist ${expert.name} im Drei-Experten-Kodierungssystem.
Kodiere den Text unabhängig und gründlich. Deine Kodierungen werden mit anderen Experten verglichen.`

    const result = await runSinglePersonaCoding(content, prompt, existingCodes, expert.temperature)
    allCodings.push(result.codings)
  }

  onProgress?.(85, 'Berechne Übereinstimmung...')

  // Find codings where at least 2/3 experts agree
  const consensusCodings = findMajorityConsensus(allCodings, 2)

  onProgress?.(95, 'Finalisiere Ergebnisse...')

  const allSuggested = allCodings.flat().map(c => ({
    name: c.codeName,
    description: c.codeDescription || '',
    color: generateColor(c.codeName),
  }))

  onProgress?.(100, 'Fertig!')

  return {
    codings: consensusCodings,
    suggestedCodes: mergeSuggestedCodes(allSuggested),
    summary: `Drei-Experten-System: ${consensusCodings.length} Kodierungen mit mindestens 2/3 Übereinstimmung.`,
  }
}

// ============================================
// CALIBRATED PATTERN CODING
// ============================================

async function runCalibratedPatternCoding(
  content: string,
  existingCodes: ExistingCode[],
  onProgress?: (progress: number, status: string) => void
): Promise<CodingResult> {
  onProgress?.(10, 'Lade bestehende Codes...')

  const codesContext = existingCodes.length > 0
    ? `\n\nBESTEHENDE CODES (verwende diese bevorzugt):\n${existingCodes.map(c => `- ${c.name}: ${c.description || 'Keine Beschreibung'}`).join('\n')}`
    : ''

  onProgress?.(30, 'Analysiere Muster...')

  const calibrationPrompt = `Du verwendest kalibrierte Mustererkennung.
${codesContext}

WICHTIG:
1. Verwende bestehende Codes wenn möglich
2. Achte auf konsistente Anwendung der Codes
3. Neue Codes nur für eindeutig neue Konzepte
4. Erkläre bei jedem Code, warum er passt`

  const response = await claude.sendMessage(
    [{ role: 'user', content: `Analysiere und kodiere diesen Text:\n\n${content}` }],
    CODING_SYSTEM_PROMPT + '\n\n' + calibrationPrompt,
    { temperature: 0.2 }
  )

  onProgress?.(80, 'Verarbeite Ergebnisse...')

  const result = parseClaudeResponse(response, content)

  onProgress?.(100, 'Fertig!')

  return {
    ...result,
    summary: `Kalibrierte Mustererkennung: ${result.codings.length} Kodierungen, ${existingCodes.length} bestehende Codes verwendet.`,
  }
}

// ============================================
// ULTRA TURBO
// ============================================

async function runUltraTurboCoding(
  content: string,
  existingCodes: ExistingCode[],
  onProgress?: (progress: number, status: string) => void
): Promise<CodingResult> {
  onProgress?.(20, 'Schnellanalyse läuft...')

  const codesContext = existingCodes.length > 0
    ? `\nBestehende Codes: ${existingCodes.map(c => c.name).join(', ')}`
    : ''

  const turboPrompt = `ULTRA-TURBO-MODUS: Schnelle explorative Kodierung.
${codesContext}

Identifiziere die wichtigsten Themen und Konzepte schnell aber gründlich.`

  const response = await claude.sendMessage(
    [{ role: 'user', content: `Schnellkodierung:\n\n${content}` }],
    CODING_SYSTEM_PROMPT + '\n\n' + turboPrompt,
    { temperature: 0.4, maxTokens: 2048 }
  )

  onProgress?.(80, 'Verarbeite Ergebnisse...')

  const result = parseClaudeResponse(response, content)

  onProgress?.(100, 'Fertig!')

  return {
    ...result,
    summary: `Ultra-Turbo: ${result.codings.length} Kodierungen in Schnellanalyse.`,
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function runSinglePersonaCoding(
  content: string,
  personaPrompt: string,
  existingCodes: ExistingCode[],
  temperature: number = 0.3
): Promise<CodingResult> {
  const codesContext = existingCodes.length > 0
    ? `\n\nBestehende Codes zur Referenz:\n${existingCodes.map(c => `- ${c.name}`).join('\n')}`
    : ''

  const response = await claude.sendMessage(
    [{ role: 'user', content: `Analysiere und kodiere:\n\n${content}` }],
    CODING_SYSTEM_PROMPT + '\n\n' + personaPrompt + codesContext,
    { temperature }
  )

  return parseClaudeResponse(response, content)
}

function parseClaudeResponse(response: ClaudeResponse, originalContent: string): CodingResult {
  try {
    const text = response.content[0]?.text || '{}'

    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('No JSON found in response:', text)
      return { codings: [], suggestedCodes: [], summary: 'Keine Kodierungen gefunden' }
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Calculate offsets for each coding
    const codings = (parsed.codings || []).map((c: any) => {
      const startOffset = originalContent.indexOf(c.selectedText)
      return {
        ...c,
        startOffset: startOffset >= 0 ? startOffset : 0,
        endOffset: startOffset >= 0 ? startOffset + c.selectedText.length : 0,
        confidence: c.confidence || 0.7,
      }
    }).filter((c: any) => c.startOffset >= 0)

    return {
      codings,
      suggestedCodes: (parsed.suggestedCodes || []).map((c: any) => ({
        name: c.name,
        description: c.description || '',
        color: c.color || generateColor(c.name),
      })),
      summary: parsed.summary || '',
    }
  } catch (err) {
    console.error('Failed to parse Claude response:', err)
    return { codings: [], suggestedCodes: [], summary: 'Fehler beim Parsen der Antwort' }
  }
}

function detectContentType(content: string): 'interview' | 'focus-group' | 'notes' | 'general' {
  const lower = content.toLowerCase()
  if (lower.includes('interviewer:') || lower.includes('frage:') || lower.includes('antwort:')) {
    return 'interview'
  }
  if (lower.includes('teilnehmer') || lower.includes('diskussion') || lower.includes('fokusgruppe')) {
    return 'focus-group'
  }
  if (lower.includes('beobachtung') || lower.includes('feldnotiz')) {
    return 'notes'
  }
  return 'general'
}

function findConsensusCodings(allCodings: CodingResult['codings']): CodingResult['codings'] {
  const codingMap = new Map<string, { coding: CodingResult['codings'][0]; count: number }>()

  for (const coding of allCodings) {
    // Create a key based on selected text and code name similarity
    const key = `${coding.selectedText.substring(0, 50)}-${coding.codeName.toLowerCase()}`
    const existing = codingMap.get(key)

    if (existing) {
      existing.count++
      // Use the coding with higher confidence
      if (coding.confidence > existing.coding.confidence) {
        existing.coding = coding
      }
    } else {
      codingMap.set(key, { coding, count: 1 })
    }
  }

  // Return codings that appear more than once (consensus)
  return Array.from(codingMap.values())
    .filter(({ count }) => count >= 2)
    .map(({ coding }) => coding)
}

function findMajorityConsensus(
  expertCodings: CodingResult['codings'][],
  minAgreement: number
): CodingResult['codings'] {
  const allCodings = expertCodings.flat()
  const codingMap = new Map<string, { coding: CodingResult['codings'][0]; count: number }>()

  for (const coding of allCodings) {
    const key = coding.selectedText.substring(0, 50)
    const existing = codingMap.get(key)

    if (existing) {
      existing.count++
      if (coding.confidence > existing.coding.confidence) {
        existing.coding = coding
      }
    } else {
      codingMap.set(key, { coding, count: 1 })
    }
  }

  return Array.from(codingMap.values())
    .filter(({ count }) => count >= minAgreement)
    .map(({ coding }) => ({
      ...coding,
      confidence: coding.confidence * (codingMap.get(coding.selectedText.substring(0, 50))?.count || 1) / expertCodings.length,
    }))
}

function mergeSuggestedCodes(codes: CodingResult['suggestedCodes']): CodingResult['suggestedCodes'] {
  const seen = new Map<string, CodingResult['suggestedCodes'][0]>()

  for (const code of codes) {
    const key = code.name.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, code)
    }
  }

  return Array.from(seen.values())
}

function generateColor(name: string): string {
  const colors = [
    '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
    '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
