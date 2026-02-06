/**
 * useAnalytics - Hook für einfaches Analytics-Tracking
 *
 * Ermöglicht Komponenten das Tracking von:
 * - Seitenaufrufen
 * - Aktionen (Export, AI-Requests, etc.)
 * - Benutzerinteraktionen
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getAnalytics, type ActionType } from '@/services/BehavioralAnalytics'

/**
 * Trackt automatisch Seitenaufrufe
 */
export function usePageTracking(): void {
  const location = useLocation()

  useEffect(() => {
    const analytics = getAnalytics()
    analytics.trackPageView(location.pathname)
  }, [location.pathname])
}

/**
 * Gibt Tracking-Funktionen zurück
 */
export function useAnalytics() {
  const analytics = getAnalytics()

  return {
    /**
     * Trackt einen Dokument-Export
     */
    trackExport: (format: string, documentCount: number) => {
      analytics.trackExport(format, documentCount)
    },

    /**
     * Trackt eine AI-Anfrage
     */
    trackAiRequest: (type: string) => {
      analytics.trackAiRequest(type)
    },

    /**
     * Trackt eine beliebige Aktion
     */
    trackAction: (type: ActionType, details?: Record<string, unknown>) => {
      analytics.trackAction(type, details)
    },

    /**
     * Gibt Session-Statistiken zurück
     */
    getSessionStats: () => {
      return analytics.getSessionStats()
    },

    /**
     * Registriert einen Callback für verdächtige Aktivitäten
     */
    onSuspiciousActivity: analytics.onSuspiciousActivity.bind(analytics),
  }
}

export default useAnalytics
