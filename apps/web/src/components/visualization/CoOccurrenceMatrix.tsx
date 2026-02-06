/**
 * Enhanced Co-Occurrence Matrix
 * Sprint 1 - Visualization Roadmap
 *
 * Features:
 * - Heatmap showing which codes appear together
 * - Click to show co-occurring segments
 * - Multiple calculation modes (document-level, segment-level)
 * - Export functionality
 */

import { useMemo, useRef, useState, useCallback } from 'react'
import { IconFilter, IconInfoCircle } from '@tabler/icons-react'
import { ChartExportButton } from './shared/ChartExportButton'
import type { Code, Coding, Document } from '@/stores/projectStore'

interface CoOccurrenceMatrixProps {
  codes: Code[]
  codings: Coding[]
  documents: Document[]
  maxCodes?: number
  onCellClick?: (code1Id: string, code2Id: string, count: number) => void
  showExport?: boolean
  title?: string
  mode?: 'document' | 'segment'
}

export default function CoOccurrenceMatrix({
  codes,
  codings,
  documents,
  maxCodes = 10,
  onCellClick,
  showExport = true,
  title = 'Code Ko-Okkurrenz',
  mode = 'document',
}: CoOccurrenceMatrixProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  const { matrix, displayCodes, maxValue, segmentCooccurrences } = useMemo(() => {
    // Get top codes by frequency
    const codeFrequencies = codes.map((code) => ({
      code,
      count: codings.filter((c) => c.codeId === code.id).length,
    }))

    const topCodes = codeFrequencies
      .sort((a, b) => b.count - a.count)
      .slice(0, maxCodes)
      .map((c) => c.code)

    // Build co-occurrence data structure for segment-level lookup
    const segmentMap: Record<string, Record<string, Set<string>>> = {}
    // segmentMap[code1Id][code2Id] = Set of segment/document IDs where they co-occur

    // Calculate co-occurrence matrix
    const matrix: number[][] = []
    let maxVal = 0

    for (let i = 0; i < topCodes.length; i++) {
      matrix[i] = []
      segmentMap[topCodes[i].id] = {}

      for (let j = 0; j < topCodes.length; j++) {
        if (i === j) {
          // Diagonal: show code's own frequency
          const count = codings.filter((c) => c.codeId === topCodes[i].id).length
          matrix[i][j] = count
          maxVal = Math.max(maxVal, count)
        } else {
          if (mode === 'document') {
            // Document-level: count documents where both codes appear
            const docsWithCodeI = new Set(
              codings.filter((c) => c.codeId === topCodes[i].id).map((c) => c.documentId)
            )
            const docsWithCodeJ = new Set(
              codings.filter((c) => c.codeId === topCodes[j].id).map((c) => c.documentId)
            )

            let coOccurrence = 0
            const sharedDocs = new Set<string>()
            docsWithCodeI.forEach((docId) => {
              if (docsWithCodeJ.has(docId)) {
                coOccurrence++
                sharedDocs.add(docId)
              }
            })

            matrix[i][j] = coOccurrence
            segmentMap[topCodes[i].id][topCodes[j].id] = sharedDocs
            maxVal = Math.max(maxVal, coOccurrence)
          } else {
            // Segment-level: count segments where codes overlap or are adjacent
            // This requires looking at character positions
            const codingsI = codings.filter((c) => c.codeId === topCodes[i].id)
            const codingsJ = codings.filter((c) => c.codeId === topCodes[j].id)

            let coOccurrence = 0
            const sharedSegments = new Set<string>()

            codingsI.forEach((ci) => {
              codingsJ.forEach((cj) => {
                if (ci.documentId === cj.documentId) {
                  // Check if segments overlap or are within 100 chars
                  const overlap =
                    (ci.startOffset <= cj.endOffset + 100 && ci.endOffset >= cj.startOffset - 100)
                  if (overlap) {
                    coOccurrence++
                    sharedSegments.add(`${ci.id}-${cj.id}`)
                  }
                }
              })
            })

            matrix[i][j] = coOccurrence
            segmentMap[topCodes[i].id][topCodes[j].id] = sharedSegments
            maxVal = Math.max(maxVal, coOccurrence)
          }
        }
      }
    }

    return { matrix, displayCodes: topCodes, maxValue: maxVal, segmentCooccurrences: segmentMap }
  }, [codes, codings, maxCodes, mode])

  const getOpacity = useCallback((value: number) => {
    if (maxValue === 0) return 0.1
    return 0.15 + (value / maxValue) * 0.85
  }, [maxValue])

  const getColor = useCallback((value: number, isDiagonal: boolean, rowColor: string) => {
    if (isDiagonal) {
      return rowColor
    }
    // Blue gradient for co-occurrences
    const opacity = getOpacity(value)
    return `rgba(59, 130, 246, ${opacity})`
  }, [getOpacity])

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    if (rowIdx === colIdx) return // Don't handle diagonal clicks

    setSelectedCell(
      selectedCell?.row === rowIdx && selectedCell?.col === colIdx
        ? null
        : { row: rowIdx, col: colIdx }
    )

    if (onCellClick) {
      const code1 = displayCodes[rowIdx]
      const code2 = displayCodes[colIdx]
      const count = matrix[rowIdx][colIdx]
      onCellClick(code1.id, code2.id, count)
    }
  }

  if (displayCodes.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconFilter size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Keine Codes vorhanden</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-surface-100">{title}</h3>
          <div className="group relative">
            <IconInfoCircle size={16} className="text-surface-500 cursor-help" />
            <div className="absolute left-0 top-6 w-64 p-3 bg-surface-800 border border-surface-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="text-xs text-surface-300">
                {mode === 'document'
                  ? 'Zeigt an, in wie vielen Dokumenten beide Codes gemeinsam vorkommen.'
                  : 'Zeigt an, wie oft Codes im gleichen oder benachbarten Segment auftreten.'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">
            {mode === 'document' ? 'Dokument-Ebene' : 'Segment-Ebene'}
          </span>
          {showExport && (
            <ChartExportButton chartRef={chartRef} filename="cooccurrence_matrix" />
          )}
        </div>
      </div>

      {/* Matrix */}
      <div ref={chartRef} className="bg-surface-900 rounded-xl p-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header row */}
          <div className="flex">
            <div className="w-28 h-10 flex-shrink-0" /> {/* Corner */}
            {displayCodes.map((code, idx) => (
              <div
                key={`header-${code.id}`}
                className="w-12 h-28 flex items-end justify-center pb-2 flex-shrink-0"
              >
                <span
                  className="text-xs text-surface-400 truncate origin-bottom-left -rotate-45 whitespace-nowrap max-w-[100px]"
                  title={code.name}
                >
                  {code.name.length > 12 ? code.name.slice(0, 10) + '...' : code.name}
                </span>
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {displayCodes.map((rowCode, rowIdx) => (
            <div key={`row-${rowCode.id}`} className="flex items-center">
              {/* Row label */}
              <div className="w-28 h-12 flex items-center gap-2 pr-2 flex-shrink-0">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: rowCode.color }}
                />
                <span
                  className="text-xs text-surface-400 truncate"
                  title={rowCode.name}
                >
                  {rowCode.name.length > 12 ? rowCode.name.slice(0, 10) + '...' : rowCode.name}
                </span>
              </div>

              {/* Cells */}
              {displayCodes.map((colCode, colIdx) => {
                const value = matrix[rowIdx][colIdx]
                const isDiagonal = rowIdx === colIdx
                const isHovered = hoveredCell?.row === rowIdx || hoveredCell?.col === colIdx
                const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx

                return (
                  <div
                    key={`cell-${rowCode.id}-${colCode.id}`}
                    className={`w-12 h-12 flex items-center justify-center text-xs transition-all flex-shrink-0 ${
                      isHovered && !isDiagonal ? 'ring-1 ring-primary-500' : ''
                    } ${isSelected ? 'ring-2 ring-primary-400' : ''} ${
                      !isDiagonal && onCellClick ? 'cursor-pointer hover:scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: getColor(value, isDiagonal, rowCode.color),
                      opacity: isDiagonal ? getOpacity(value) : 1,
                    }}
                    onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => !isDiagonal && handleCellClick(rowIdx, colIdx)}
                    title={
                      isDiagonal
                        ? `${rowCode.name}: ${value} Kodierungen`
                        : `${rowCode.name} & ${colCode.name}: ${value} ${
                            mode === 'document' ? 'gemeinsame Dokumente' : 'Ko-Okkurrenzen'
                          }`
                    }
                  >
                    <span className={`font-medium ${value > 0 ? 'text-white' : 'text-surface-600'}`}>
                      {value}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-surface-500 px-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/20" />
            <span>Wenige</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/60" />
            <span>Mittel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>Viele</span>
          </div>
        </div>
        <span>Diagonale = eigene Haeufigkeit</span>
      </div>

      {/* Selected cell info */}
      {selectedCell && selectedCell.row !== selectedCell.col && (
        <div className="bg-surface-800 border border-surface-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: displayCodes[selectedCell.row].color }}
            />
            <span className="text-surface-200">{displayCodes[selectedCell.row].name}</span>
            <span className="text-surface-500">&</span>
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: displayCodes[selectedCell.col].color }}
            />
            <span className="text-surface-200">{displayCodes[selectedCell.col].name}</span>
          </div>
          <p className="text-sm text-surface-400">
            {matrix[selectedCell.row][selectedCell.col]} {mode === 'document' ? 'gemeinsame Dokumente' : 'Ko-Okkurrenzen'}
          </p>
        </div>
      )}
    </div>
  )
}
