import { useState, useEffect } from 'react'
import {
  useHistoryStore,
  EntityType,
  ChangeType,
  HistoryEntry,
  changeTypeLabels,
  changeTypeColors,
  entityTypeLabels,
  entityTypeIcons,
} from '@/stores/historyStore'

interface HistoryPanelProps {
  projectId: string
  entityType?: EntityType
  entityId?: string
}

export default function HistoryPanel({ projectId, entityType, entityId }: HistoryPanelProps) {
  const { entries, isLoading, error, fetchHistory, restoreVersion } = useHistoryStore()
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all')
  const [filterChange, setFilterChange] = useState<ChangeType | 'all'>('all')
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory(projectId, {
      entityType: entityType,
      entityId: entityId,
    })
  }, [projectId, entityType, entityId, fetchHistory])

  const filteredEntries = entries.filter(entry => {
    if (filterType !== 'all' && entry.entityType !== filterType) return false
    if (filterChange !== 'all' && entry.changeType !== filterChange) return false
    return true
  })

  const handleRestore = async (entryId: string) => {
    setRestoring(entryId)
    await restoreVersion(entryId)
    setRestoring(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Gerade eben'
    if (diffHours < 24) return `Vor ${diffHours} Stunden`
    if (diffDays < 7) return `Vor ${diffDays} Tagen`
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-surface-100">Änderungsverlauf</h3>
            <p className="text-sm text-surface-500">{filteredEntries.length} Einträge</p>
          </div>
          <button
            onClick={() => fetchHistory(projectId)}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
            title="Aktualisieren"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        {!entityType && (
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as EntityType | 'all')}
              className="px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="all">Alle Typen</option>
              {(['code', 'coding', 'document', 'memo'] as EntityType[]).map(type => (
                <option key={type} value={type}>{entityTypeLabels[type]}</option>
              ))}
            </select>

            <select
              value={filterChange}
              onChange={(e) => setFilterChange(e.target.value as ChangeType | 'all')}
              className="px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="all">Alle Änderungen</option>
              {(['create', 'update', 'delete', 'restore'] as ChangeType[]).map(type => (
                <option key={type} value={type}>{changeTypeLabels[type]}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="max-h-[500px] overflow-y-auto">
        {isLoading && filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            <div className="animate-spin w-6 h-6 border-2 border-surface-600 border-t-primary-500 rounded-full mx-auto mb-2" />
            <p className="text-sm">Lade Verlauf...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <p className="text-sm">{error}</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Noch keine Änderungen</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-800">
            {filteredEntries.map(entry => (
              <HistoryEntryRow
                key={entry.id}
                entry={entry}
                isExpanded={expandedEntry === entry.id}
                onToggle={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                onRestore={() => handleRestore(entry.id)}
                isRestoring={restoring === entry.id}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryEntryRow({
  entry,
  isExpanded,
  onToggle,
  onRestore,
  isRestoring,
  formatDate,
  formatTime,
}: {
  entry: HistoryEntry
  isExpanded: boolean
  onToggle: () => void
  onRestore: () => void
  isRestoring: boolean
  formatDate: (d: string) => string
  formatTime: (d: string) => string
}) {
  const canRestore = entry.changeType !== 'create' && entry.previousValue !== null

  return (
    <div className="hover:bg-surface-800/30 transition-colors">
      {/* Main Row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Icon */}
        <div className={`p-2 rounded-lg ${changeTypeColors[entry.changeType]}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={entityTypeIcons[entry.entityType]} />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-surface-100 truncate">{entry.entityName}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${changeTypeColors[entry.changeType]}`}>
              {changeTypeLabels[entry.changeType]}
            </span>
          </div>
          <p className="text-sm text-surface-400 truncate">{entry.description}</p>
        </div>

        {/* Meta */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm text-surface-300">{formatDate(entry.changedAt)}</p>
          <p className="text-xs text-surface-500">{entry.changedByName}</p>
        </div>

        {/* Expand Icon */}
        <svg
          className={`w-4 h-4 text-surface-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-surface-950 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Previous Value */}
              <div>
                <h4 className="text-xs font-medium text-surface-400 mb-2">Vorher</h4>
                {entry.previousValue ? (
                  <pre className="text-xs text-surface-300 bg-surface-900 rounded p-2 overflow-x-auto">
                    {JSON.stringify(entry.previousValue, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-surface-500 italic">Nicht vorhanden</p>
                )}
              </div>

              {/* New Value */}
              <div>
                <h4 className="text-xs font-medium text-surface-400 mb-2">Nachher</h4>
                {entry.newValue ? (
                  <pre className="text-xs text-surface-300 bg-surface-900 rounded p-2 overflow-x-auto">
                    {JSON.stringify(entry.newValue, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-surface-500 italic">Gelöscht</p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="mt-4 pt-4 border-t border-surface-800 flex items-center justify-between">
              <div className="text-xs text-surface-500">
                <span>Zeitpunkt: {formatTime(entry.changedAt)}</span>
                <span className="mx-2">•</span>
                <span>Typ: {entityTypeLabels[entry.entityType]}</span>
              </div>

              {/* Restore Button */}
              {canRestore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRestore()
                  }}
                  disabled={isRestoring}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-sm transition-colors disabled:opacity-50"
                >
                  {isRestoring ? (
                    <>
                      <div className="w-3 h-3 border border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      Wiederherstellen...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Wiederherstellen
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact history view for sidebars
export function HistoryMini({ projectId, limit = 5 }: { projectId: string; limit?: number }) {
  const { entries, fetchHistory } = useHistoryStore()

  useEffect(() => {
    fetchHistory(projectId, { limit })
  }, [projectId, limit, fetchHistory])

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-surface-400">Letzte Änderungen</h4>
      {entries.slice(0, limit).map(entry => (
        <div key={entry.id} className="flex items-center gap-2 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${
            entry.changeType === 'create' ? 'bg-green-500' :
            entry.changeType === 'update' ? 'bg-blue-500' :
            entry.changeType === 'delete' ? 'bg-red-500' : 'bg-purple-500'
          }`} />
          <span className="text-surface-400 truncate flex-1">{entry.entityName}</span>
          <span className="text-surface-500">{changeTypeLabels[entry.changeType]}</span>
        </div>
      ))}
    </div>
  )
}
