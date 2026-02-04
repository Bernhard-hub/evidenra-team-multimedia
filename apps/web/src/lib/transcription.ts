/**
 * Audio/Video Transcription Service
 * Uses OpenAI's Whisper API for transcription
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions'

export interface TranscriptionSegment {
  id: number
  start: number // seconds
  end: number // seconds
  text: string
}

export interface TranscriptionResult {
  text: string
  segments: TranscriptionSegment[]
  language: string
  duration: number
}

// Get API key from localStorage
function getOpenAIKey(): string | null {
  return localStorage.getItem('openai-api-key')
}

export function hasOpenAIKey(): boolean {
  return !!getOpenAIKey()
}

export function setOpenAIKey(key: string): void {
  localStorage.setItem('openai-api-key', key)
}

export function clearOpenAIKey(): void {
  localStorage.removeItem('openai-api-key')
}

// Check if file is a supported audio/video format
export function isSupportedMediaFile(file: File): boolean {
  const supportedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/m4a',
    'audio/mp4',
    'video/mp4',
    'video/webm',
    'video/mpeg',
    'video/quicktime',
  ]

  const supportedExtensions = [
    'mp3', 'wav', 'webm', 'ogg', 'm4a', 'mp4', 'mpeg', 'mpga', 'oga', 'flac'
  ]

  const extension = file.name.split('.').pop()?.toLowerCase() || ''

  return supportedTypes.includes(file.type) || supportedExtensions.includes(extension)
}

// Get file duration using HTML5 Audio/Video element
export async function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const media = file.type.startsWith('video/')
      ? document.createElement('video')
      : document.createElement('audio')

    media.preload = 'metadata'

    media.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(media.duration)
    }

    media.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Mediendatei konnte nicht geladen werden'))
    }

    media.src = url
  })
}

// Format seconds to HH:MM:SS
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Format transcript with timestamps
export function formatTranscriptWithTimestamps(result: TranscriptionResult): string {
  if (!result.segments || result.segments.length === 0) {
    return result.text
  }

  return result.segments
    .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text}`)
    .join('\n')
}

// Transcribe audio/video file using OpenAI Whisper
export async function transcribeFile(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<TranscriptionResult> {
  const apiKey = getOpenAIKey()

  // Demo mode if no API key
  if (!apiKey) {
    return transcribeFileDemo(file, onProgress)
  }

  onProgress?.(10, 'Bereite Datei vor...')

  // Check file size (max 25MB for Whisper)
  const MAX_SIZE = 25 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error('Datei ist zu groß. Maximum: 25MB')
  }

  onProgress?.(20, 'Sende an Transkriptionsdienst...')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')
  formData.append('language', 'de') // German by default

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    })

    onProgress?.(60, 'Verarbeite Transkription...')

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `API-Fehler: ${response.status}`)
    }

    const data = await response.json()
    onProgress?.(90, 'Finalisiere...')

    const result: TranscriptionResult = {
      text: data.text || '',
      language: data.language || 'de',
      duration: data.duration || 0,
      segments: (data.segments || []).map((seg: any, idx: number) => ({
        id: idx,
        start: seg.start || 0,
        end: seg.end || 0,
        text: seg.text?.trim() || '',
      })),
    }

    onProgress?.(100, 'Fertig!')
    return result
  } catch (error) {
    console.error('Transcription error:', error)
    throw error
  }
}

// Demo transcription for testing without API key
async function transcribeFileDemo(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<TranscriptionResult> {
  onProgress?.(10, 'Demo-Modus: Bereite Datei vor...')

  // Get actual duration if possible
  let duration = 120 // default 2 minutes
  try {
    duration = await getMediaDuration(file)
  } catch (e) {
    console.warn('Could not get media duration:', e)
  }

  onProgress?.(30, 'Demo-Modus: Generiere Beispiel-Transkript...')

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1500))
  onProgress?.(60, 'Demo-Modus: Verarbeite Segmente...')

  await new Promise((resolve) => setTimeout(resolve, 1000))
  onProgress?.(90, 'Demo-Modus: Finalisiere...')

  // Generate demo transcript based on file name
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const demoSegments: TranscriptionSegment[] = [
    { id: 0, start: 0, end: 15, text: `Dies ist eine Demo-Transkription der Datei "${baseName}".` },
    { id: 1, start: 15, end: 35, text: 'Die echte Transkription benötigt einen OpenAI API-Schlüssel.' },
    { id: 2, start: 35, end: 55, text: 'Sie können den Schlüssel in den Einstellungen konfigurieren.' },
    { id: 3, start: 55, end: 75, text: 'Das Whisper-Modell unterstützt über 50 Sprachen und erkennt die Sprache automatisch.' },
    { id: 4, start: 75, end: 95, text: 'Die Transkription enthält Zeitstempel für jeden Abschnitt.' },
    { id: 5, start: 95, end: duration, text: 'Dies ermöglicht präzises Kodieren von Audio- und Videomaterial.' },
  ]

  await new Promise((resolve) => setTimeout(resolve, 500))
  onProgress?.(100, 'Demo-Modus: Fertig!')

  return {
    text: demoSegments.map((s) => s.text).join(' '),
    segments: demoSegments.filter((s) => s.end <= duration),
    language: 'de',
    duration,
  }
}

// Convert transcription to document content
export function transcriptionToDocumentContent(
  result: TranscriptionResult,
  includeTimestamps: boolean = true
): string {
  if (includeTimestamps && result.segments.length > 0) {
    return formatTranscriptWithTimestamps(result)
  }
  return result.text
}
