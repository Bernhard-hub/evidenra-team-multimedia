import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  searchDocuments,
  searchCodings,
  getFilterOptions,
  type SearchFilters,
  type SearchResult,
} from '@/lib/search'
import type { Document, Code, Coding } from '@/stores/projectStore'

interface SearchPanelProps {
  projectId: string
  documents: Document[]
  codes: Code[]
  codings: Coding[]
  onClose: () => void
}

type SearchMode = 'documents' | 'codings'

export default function SearchPanel({
  projectId,
  documents,
  codes,
  codings,
  onClose,
}: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('documents')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    codeIds: [],
    documentTypes: [],
    codingMethods: [],
  })

  // Get available filter options
  const filterOptions = useMemo(
    () => getFilterOptions(documents, codes, codings),
    [documents, codes, codings]
  )

  // Update filters when query changes
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setFilters((prev) => ({ ...prev, query: value }))
  }, [])

  // Perform search
  const documentResults = useMemo(() => {
    if (!filters.query && !filters.codeIds?.length && !filters.documentTypes?.length) {
      return []
    }
    return searchDocuments(documents, codings, codes, filters)
  }, [documents, codings, codes, filters])

  const codingResults = useMemo(() => {
    if (!filters.query && !filters.codeIds?.length && !filters.documentTypes?.length) {
      return []
    }
    return searchCodings(codings, codes, documents, filters)
  }, [codings, codes, documents, filters])

  const totalResults = searchMode === 'documents' ? documentResults.length : codingResults.length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-surface-900 rounded-2xl border border-surface-800 shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-surface-800">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Suchen in Dokumenten und Kodierungen..."
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-lg border transition-colors ${
                showFilters || Object.values(filters).some((v) => v && (Array.isArray(v) ? v.length : v))
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-surface-700 text-surface-400 hover:bg-surface-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-3 rounded-lg border border-surface-700 text-surface-400 hover:bg-surface-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-lg bg-surface-800 space-y-4">
              {/* Code Filter */}
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Nach Codes filtern
                </label>
                <div className="flex flex-wrap gap-2">
                  {codes.map((code) => (
                    <button
                      key={code.id}
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          codeIds: prev.codeIds?.includes(code.id)
                            ? prev.codeIds.filter((id) => id !== code.id)
                            : [...(prev.codeIds || []), code.id],
                        }))
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters.codeIds?.includes(code.id)
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'bg-surface-700 text-surface-400 hover:text-surface-200'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: code.color }}
                      />
                      {code.name}
                    </button>
                  ))}
                  {codes.length === 0 && (
                    <span className="text-sm text-surface-500">Keine Codes vorhanden</span>
                  )}
                </div>
              </div>

              {/* Document Type Filter */}
              {filterOptions.documentTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Dokumenttyp
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.documentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            documentTypes: prev.documentTypes?.includes(type)
                              ? prev.documentTypes.filter((t) => t !== type)
                              : [...(prev.documentTypes || []), type],
                          }))
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          filters.documentTypes?.includes(type)
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'bg-surface-700 text-surface-400 hover:text-surface-200'
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Coding Method Filter */}
              {filterOptions.codingMethods.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Kodierungsmethode
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.codingMethods.map((method) => (
                      <button
                        key={method}
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            codingMethods: prev.codingMethods?.includes(method)
                              ? prev.codingMethods.filter((m) => m !== method)
                              : [...(prev.codingMethods || []), method],
                          }))
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          filters.codingMethods?.includes(method)
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'bg-surface-700 text-surface-400 hover:text-surface-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setFilters({ query, codeIds: [], documentTypes: [], codingMethods: [] })
                }}
                className="text-sm text-surface-400 hover:text-surface-200"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Search Mode Toggle */}
        <div className="px-4 py-2 border-b border-surface-800 flex items-center gap-4">
          <button
            onClick={() => setSearchMode('documents')}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
              searchMode === 'documents'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-surface-400 hover:text-surface-200'
            }`}
          >
            Dokumente ({documentResults.length})
          </button>
          <button
            onClick={() => setSearchMode('codings')}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
              searchMode === 'codings'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-surface-400 hover:text-surface-200'
            }`}
          >
            Kodierungen ({codingResults.length})
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!query && !filters.codeIds?.length && !filters.documentTypes?.length ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-surface-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-surface-400">
                Geben Sie einen Suchbegriff ein oder wählen Sie Filter aus
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-surface-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-surface-400">Keine Ergebnisse gefunden</p>
            </div>
          ) : searchMode === 'documents' ? (
            <div className="space-y-4">
              {documentResults.map((result) => (
                <DocumentResultCard
                  key={result.documentId}
                  result={result}
                  projectId={projectId}
                  onClick={onClose}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {codingResults.map((coding) => {
                const code = codes.find((c) => c.id === coding.codeId)
                const doc = documents.find((d) => d.id === coding.documentId)
                return (
                  <CodingResultCard
                    key={coding.id}
                    coding={coding}
                    code={code}
                    document={doc}
                    projectId={projectId}
                    query={query}
                    onClick={onClose}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-surface-800 text-center">
          <p className="text-xs text-surface-500">
            {totalResults} Ergebnisse gefunden
            {query && ` für "${query}"`}
          </p>
        </div>
      </div>
    </div>
  )
}

function DocumentResultCard({
  result,
  projectId,
  onClick,
}: {
  result: SearchResult
  projectId: string
  onClick: () => void
}) {
  return (
    <Link
      to={`/project/${projectId}/document/${result.documentId}`}
      onClick={onClick}
      className="block p-4 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-surface-100">{result.documentName}</h3>
        <span className="text-xs text-surface-500">{result.totalMatches} Treffer</span>
      </div>
      {result.matches.slice(0, 3).map((match, idx) => (
        <div key={idx} className="mt-2 text-sm">
          <p
            className="text-surface-400 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: match.highlightedText.replace(
                /<mark>/g,
                '<mark class="bg-primary-500/30 text-primary-200 px-0.5 rounded">'
              ),
            }}
          />
          {match.codeName && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: match.codeColor }}
              />
              <span className="text-xs text-surface-500">{match.codeName}</span>
            </div>
          )}
        </div>
      ))}
      {result.matches.length > 3 && (
        <p className="mt-2 text-xs text-surface-500">
          +{result.matches.length - 3} weitere Treffer
        </p>
      )}
    </Link>
  )
}

function CodingResultCard({
  coding,
  code,
  document,
  projectId,
  query,
  onClick,
}: {
  coding: Coding
  code?: Code
  document?: Document
  projectId: string
  query: string
  onClick: () => void
}) {
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text
    const regex = new RegExp(`(${searchQuery})`, 'gi')
    return text.replace(
      regex,
      '<mark class="bg-primary-500/30 text-primary-200 px-0.5 rounded">$1</mark>'
    )
  }

  return (
    <Link
      to={`/project/${projectId}/document/${coding.documentId}`}
      onClick={onClick}
      className="block p-3 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        {code && (
          <>
            <span
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: code.color }}
            />
            <span className="text-sm font-medium text-surface-200">{code.name}</span>
          </>
        )}
        <span className="text-xs text-surface-500">in {document?.name || 'Unbekannt'}</span>
      </div>
      <p
        className="text-sm text-surface-400 line-clamp-2"
        dangerouslySetInnerHTML={{ __html: highlightText(coding.selectedText, query) }}
      />
      {coding.memo && (
        <p className="mt-1 text-xs text-surface-500 italic line-clamp-1">
          Memo: {coding.memo}
        </p>
      )}
    </Link>
  )
}

// Keyboard shortcut hook
export function useSearchShortcut(onOpen: () => void) {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpen()
      }
    })
  }
}
