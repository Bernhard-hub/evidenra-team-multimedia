/**
 * BehavioralAnalytics - Phase 3: Nutzerverhalten-Tracking
 *
 * Erfasst wer, wann, von wo und wie auf die App zugreift.
 * Ermöglicht Erkennung von:
 * - Ungewöhnlichen Zugriffsmustern
 * - Account-Sharing (verschiedene Zeitzonen/Standorte)
 * - Verdächtige Aktivitäten (Massen-Downloads, etc.)
 *
 * Datenschutz: Alle Daten bleiben lokal oder werden anonymisiert an den Server gesendet.
 */

import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint'

interface SessionData {
  sessionId: string
  userId: string
  deviceId: string
  startTime: number
  lastActivity: number
  pageViews: number
  actions: ActionLog[]
  metadata: {
    timezone: string
    language: string
    screenSize: string
    userAgent: string
    referrer: string
  }
}

interface ActionLog {
  type: ActionType
  timestamp: number
  details?: Record<string, unknown>
}

type ActionType =
  | 'page_view'
  | 'document_open'
  | 'document_export'
  | 'code_create'
  | 'code_apply'
  | 'ai_request'
  | 'search'
  | 'settings_change'
  | 'team_invite'
  | 'bulk_action'

interface AnalyticsConfig {
  enabled: boolean
  sendToServer: boolean
  maxActionsStored: number
  sessionTimeout: number // ms
  suspiciousThresholds: {
    maxExportsPerHour: number
    maxDocumentsPerMinute: number
    maxAiRequestsPerHour: number
  }
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  sendToServer: false, // Erst aktivieren wenn Server-Endpoint bereit
  maxActionsStored: 500,
  sessionTimeout: 30 * 60 * 1000, // 30 Minuten
  suspiciousThresholds: {
    maxExportsPerHour: 50,
    maxDocumentsPerMinute: 20,
    maxAiRequestsPerHour: 100,
  },
}

class BehavioralAnalyticsService {
  private config: AnalyticsConfig
  private session: SessionData | null = null
  private suspiciousActivityCallbacks: ((activity: SuspiciousActivity) => void)[] = []

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Startet eine neue Session
   */
  startSession(userId: string, deviceId: string): void {
    if (!this.config.enabled) return

    this.session = {
      sessionId: this.generateSessionId(),
      userId,
      deviceId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      actions: [],
      metadata: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      },
    }

    // Speichere Session-Start
    this.persistSession()
  }

  /**
   * Beendet die aktuelle Session
   */
  endSession(): void {
    if (!this.session) return

    // Sende Session-Daten an Server wenn konfiguriert
    if (this.config.sendToServer) {
      this.sendToServer()
    }

    this.session = null
    localStorage.removeItem('analytics-session')
  }

  /**
   * Trackt eine Aktion
   */
  trackAction(type: ActionType, details?: Record<string, unknown>): void {
    if (!this.config.enabled || !this.session) return

    const action: ActionLog = {
      type,
      timestamp: Date.now(),
      details,
    }

    this.session.actions.push(action)
    this.session.lastActivity = Date.now()

    if (type === 'page_view') {
      this.session.pageViews++
    }

    // Prüfe auf verdächtige Aktivitäten
    this.checkForSuspiciousActivity(type)

    // Begrenze die Anzahl gespeicherter Aktionen
    if (this.session.actions.length > this.config.maxActionsStored) {
      this.session.actions = this.session.actions.slice(-this.config.maxActionsStored)
    }

    this.persistSession()
  }

  /**
   * Trackt einen Seitenaufruf
   */
  trackPageView(path: string): void {
    this.trackAction('page_view', { path })
  }

  /**
   * Trackt einen Dokument-Export
   */
  trackExport(format: string, documentCount: number): void {
    this.trackAction('document_export', { format, documentCount })
  }

  /**
   * Trackt eine AI-Anfrage
   */
  trackAiRequest(type: string): void {
    this.trackAction('ai_request', { type })
  }

  /**
   * Prüft auf verdächtige Aktivitäten
   */
  private checkForSuspiciousActivity(type: ActionType): void {
    if (!this.session) return

    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneMinuteAgo = now - 60 * 1000

    const recentActions = this.session.actions.filter(a => a.timestamp > oneHourAgo)

    // Prüfe Export-Rate
    if (type === 'document_export') {
      const exports = recentActions.filter(a => a.type === 'document_export')
      if (exports.length > this.config.suspiciousThresholds.maxExportsPerHour) {
        this.reportSuspiciousActivity({
          type: 'excessive_exports',
          count: exports.length,
          threshold: this.config.suspiciousThresholds.maxExportsPerHour,
          timeWindow: '1 hour',
        })
      }
    }

    // Prüfe Dokument-Öffnungsrate
    if (type === 'document_open') {
      const recentDocs = this.session.actions.filter(
        a => a.type === 'document_open' && a.timestamp > oneMinuteAgo
      )
      if (recentDocs.length > this.config.suspiciousThresholds.maxDocumentsPerMinute) {
        this.reportSuspiciousActivity({
          type: 'excessive_document_access',
          count: recentDocs.length,
          threshold: this.config.suspiciousThresholds.maxDocumentsPerMinute,
          timeWindow: '1 minute',
        })
      }
    }

    // Prüfe AI-Anfragen-Rate
    if (type === 'ai_request') {
      const aiRequests = recentActions.filter(a => a.type === 'ai_request')
      if (aiRequests.length > this.config.suspiciousThresholds.maxAiRequestsPerHour) {
        this.reportSuspiciousActivity({
          type: 'excessive_ai_requests',
          count: aiRequests.length,
          threshold: this.config.suspiciousThresholds.maxAiRequestsPerHour,
          timeWindow: '1 hour',
        })
      }
    }
  }

  /**
   * Meldet verdächtige Aktivität
   */
  private reportSuspiciousActivity(activity: SuspiciousActivity): void {
    // Rufe alle registrierten Callbacks auf
    this.suspiciousActivityCallbacks.forEach(cb => cb(activity))

    // Logge lokal (wird in Production entfernt durch Terser)
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Suspicious activity detected:', activity)
    }
  }

  /**
   * Registriert einen Callback für verdächtige Aktivitäten
   */
  onSuspiciousActivity(callback: (activity: SuspiciousActivity) => void): () => void {
    this.suspiciousActivityCallbacks.push(callback)
    return () => {
      this.suspiciousActivityCallbacks = this.suspiciousActivityCallbacks.filter(
        cb => cb !== callback
      )
    }
  }

  /**
   * Gibt Session-Statistiken zurück
   */
  getSessionStats(): SessionStats | null {
    if (!this.session) return null

    const duration = Date.now() - this.session.startTime
    const actionCounts = this.session.actions.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1
      return acc
    }, {} as Record<ActionType, number>)

    return {
      sessionId: this.session.sessionId,
      duration,
      pageViews: this.session.pageViews,
      totalActions: this.session.actions.length,
      actionCounts,
      metadata: this.session.metadata,
    }
  }

  /**
   * Persistiert die Session im localStorage
   */
  private persistSession(): void {
    if (!this.session) return
    localStorage.setItem('analytics-session', JSON.stringify(this.session))
  }

  /**
   * Stellt eine Session wieder her
   */
  restoreSession(): boolean {
    try {
      const stored = localStorage.getItem('analytics-session')
      if (!stored) return false

      const session = JSON.parse(stored) as SessionData
      const now = Date.now()

      // Prüfe ob Session noch gültig ist
      if (now - session.lastActivity > this.config.sessionTimeout) {
        localStorage.removeItem('analytics-session')
        return false
      }

      this.session = session
      return true
    } catch {
      return false
    }
  }

  /**
   * Sendet Session-Daten an den Server
   */
  private async sendToServer(): Promise<void> {
    if (!this.session) return

    // TODO: Implementiere Server-Endpoint
    // const response = await fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     sessionId: this.session.sessionId,
    //     userId: this.session.userId,
    //     deviceId: this.session.deviceId,
    //     stats: this.getSessionStats(),
    //   }),
    // })
  }

  /**
   * Generiert eine eindeutige Session-ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

interface SuspiciousActivity {
  type: string
  count: number
  threshold: number
  timeWindow: string
}

interface SessionStats {
  sessionId: string
  duration: number
  pageViews: number
  totalActions: number
  actionCounts: Record<ActionType, number>
  metadata: SessionData['metadata']
}

// Singleton-Instanz
let analyticsInstance: BehavioralAnalyticsService | null = null

export function getAnalytics(): BehavioralAnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new BehavioralAnalyticsService()
  }
  return analyticsInstance
}

export { BehavioralAnalyticsService, type ActionType, type SessionStats, type SuspiciousActivity }
export default getAnalytics
