/**
 * Visualization Dashboard
 * Sprint 1 - Visualization Roadmap
 *
 * Features:
 * - Combines all visualization components
 * - Tab-based navigation between views
 * - Responsive layout
 * - Filter and settings controls
 */

import { useState, useMemo } from 'react'
import {
  IconChartBar,
  IconGridDots,
  IconTable,
  IconSettings,
  IconRefresh,
  IconFilter,
} from '@tabler/icons-react'
import CodeFrequencyChart from './CodeFrequencyChart'
import CoOccurrenceMatrix from './CoOccurrenceMatrix'
import CodeDocumentHeatmap from './CodeDocumentHeatmap'
import type { Code, Coding, Document } from '@/stores/projectStore'

type ViewType = 'frequency' | 'cooccurrence' | 'document-heatmap'
type CoOccurrenceMode = 'document' | 'segment'

interface VisualizationDashboardProps {
  codes: Code[]
  codings: Coding[]
  documents: Document[]
  onCodeClick?: (codeId: string, codeName: string) => void
  onCellClick?: (code1Id: string, code2Id: string | null, count: number) => void
  onDocumentCodeClick?: (codeId: string, documentId: string, count: number) => void
}

export default function VisualizationDashboard({
  codes,
  codings,
  documents,
  onCodeClick,
  onCellClick,
  onDocumentCodeClick,
}: VisualizationDashboardProps) {
  const [activeView, setActiveView] = useState<ViewType>('frequency')
  const [maxItems, setMaxItems] = useState(10)
  const [coOccurrenceMode, setCoOccurrenceMode] = useState<CoOccurrenceMode>('document')
  const [showSettings, setShowSettings] = useState(false)

  // Statistics
  const stats = useMemo(() => {
    const totalCodings = codings.length
    const totalCodes = codes.length
    const totalDocuments = documents.length
    const codedDocuments = new Set(codings.map((c) => c.documentId)).size
    const avgCodingsPerDoc = codedDocuments > 0 ? (totalCodings / codedDocuments).toFixed(1) : '0'
    const avgCodingsPerCode = totalCodes > 0 ? (totalCodings / totalCodes).toFixed(1) : '0'

    return {
      totalCodings,
      totalCodes,
      totalDocuments,
      codedDocuments,
      avgCodingsPerDoc,
      avgCodingsPerCode,
    }
  }, [codes, codings, documents])

  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'frequency', label: 'Code-Haeufigkeit', icon: <IconChartBar size={18} /> },
    { id: 'cooccurrence', label: 'Ko-Okkurrenz', icon: <IconGridDots size={18} /> },
    { id: 'document-heatmap', label: 'Code-Dokument', icon: <IconTable size={18} /> },
  ]

  if (codes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <IconFilter size={64} className="text-surface-600 mb-4" />
        <h3 className="text-lg font-medium text-surface-300 mb-2">Keine Codes vorhanden</h3>
        <p className="text-surface-500 max-w-md">
          Erstellen Sie Codes und kodieren Sie Dokumente, um Visualisierungen zu sehen.
        </p>
      </div>
    )
  }

  if (codings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <IconFilter size={64} className="text-surface-600 mb-4" />
        <h3 className="text-lg font-medium text-surface-300 mb-2">Keine Kodierungen vorhanden</h3>
        <p className="text-surface-500 max-w-md">
          Kodieren Sie Dokumente mit den vorhandenen Codes, um Visualisierungen zu sehen.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-surface-900 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-surface-100">Visualisierungen</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? 'bg-primary-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:text-surface-200'
            }`}
            title="Einstellungen"
          >
            <IconSettings size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-surface-800 rounded-lg p-3">
            <p className="text-xs text-surface-500 mb-1">Codes</p>
            <p className="text-lg font-semibold text-surface-100">{stats.totalCodes}</p>
          </div>
          <div className="bg-surface-800 rounded-lg p-3">
            <p className="text-xs text-surface-500 mb-1">Kodierungen</p>
            <p className="text-lg font-semibold text-surface-100">{stats.totalCodings}</p>
          </div>
          <div className="bg-surface-800 rounded-lg p-3">
            <p className="text-xs text-surface-500 mb-1">Dokumente</p>
            <p className="text-lg font-semibold text-surface-100">{stats.totalDocuments}</p>
          </div>
          <div className="bg-surface-800 rounded-lg p-3">
            <p className="text-xs text-surface-500 mb-1">Kodierte Dok.</p>
            <p className="text-lg font-semibold text-surface-100">{stats.codedDocuments}</p>
          </div>
          <div className="bg-surface-800 rounded-lg p-3">
            <p className="text-xs text-surface-500 mb-1">Kod./Dokument</p>
            <p className="text-lg font-semibold text-surface-100">{stats.avgCodingsPerDoc}</p>
          </div>
          <div className="bg-surface-800 rounded-lg p-3">
            <p className="text-xs text-surface-500 mb-1">Kod./Code</p>
            <p className="text-lg font-semibold text-surface-100">{stats.avgCodingsPerCode}</p>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-surface-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-surface-400 mb-2">
                  Max. angezeigte Elemente
                </label>
                <select
                  value={maxItems}
                  onChange={(e) => setMaxItems(Number(e.target.value))}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                </select>
              </div>

              {activeView === 'cooccurrence' && (
                <div>
                  <label className="block text-sm text-surface-400 mb-2">Ko-Okkurrenz Modus</label>
                  <select
                    value={coOccurrenceMode}
                    onChange={(e) => setCoOccurrenceMode(e.target.value as CoOccurrenceMode)}
                    className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 text-sm"
                  >
                    <option value="document">Dokument-Ebene</option>
                    <option value="segment">Segment-Ebene</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-2 border-b border-surface-800 pb-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeView === view.id
                ? 'bg-primary-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:text-surface-200 hover:bg-surface-700'
            }`}
          >
            {view.icon}
            <span className="text-sm font-medium">{view.label}</span>
          </button>
        ))}
      </div>

      {/* Active view */}
      <div className="bg-surface-950 rounded-xl p-6 border border-surface-800">
        {activeView === 'frequency' && (
          <CodeFrequencyChart
            codes={codes}
            codings={codings}
            maxBars={maxItems}
            onCodeClick={onCodeClick}
            showExport={true}
          />
        )}

        {activeView === 'cooccurrence' && (
          <CoOccurrenceMatrix
            codes={codes}
            codings={codings}
            documents={documents}
            maxCodes={maxItems}
            mode={coOccurrenceMode}
            onCellClick={onCellClick}
            showExport={true}
          />
        )}

        {activeView === 'document-heatmap' && (
          <CodeDocumentHeatmap
            codes={codes}
            codings={codings}
            documents={documents}
            maxCodes={maxItems}
            maxDocuments={maxItems}
            onCellClick={onDocumentCodeClick}
            showExport={true}
          />
        )}
      </div>

      {/* Help text */}
      <div className="text-center text-xs text-surface-600">
        <p>
          Klicken Sie auf Diagrammelemente, um Details anzuzeigen. Exportieren Sie Diagramme als PNG
          oder SVG.
        </p>
      </div>
    </div>
  )
}
