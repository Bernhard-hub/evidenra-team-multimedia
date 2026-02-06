/**
 * Code-Document Heatmap
 * Sprint 1 - Visualization Roadmap
 *
 * Features:
 * - Matrix showing which codes appear in which documents
 * - Color intensity = frequency in that document
 * - Click to navigate to document/code
 * - Export functionality
 */

import { useMemo, useRef, useState, useCallback } from 'react'
import { IconFilter, IconInfoCircle, IconFileText } from '@tabler/icons-react'
import { ChartExportButton } from './shared/ChartExportButton'
import type { Code, Coding, Document } from '@/stores/projectStore'

interface CodeDocumentHeatmapProps {
  codes: Code[]
  codings: Coding[]
  documents: Document[]
  maxCodes?: number
  maxDocuments?: number
  onCellClick?: (codeId: string, documentId: string, count: number) => void
  showExport?: boolean
  title?: string
}

export default function CodeDocumentHeatmap({
  codes,
  codings,
  documents,
  maxCodes = 10,
  maxDocuments = 10,
  onCellClick,
  showExport = true,
  title = 'Code-Dokument Verteilung',
}: CodeDocumentHeatmapProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  const { matrix, displayCodes, displayDocuments, maxValue, totals } = useMemo(() => {
    // Get top codes by frequency
    const codeFrequencies = codes.map((code) => ({
      code,
      count: codings.filter((c) => c.codeId === code.id).length,
    }))

    const topCodes = codeFrequencies
      .sort((a, b) => b.count - a.count)
      .slice(0, maxCodes)
      .map((c) => c.code)

    // Get documents that have codings (sorted by coding count)
    const docCodingCounts = documents.map((doc) => ({
      doc,
      count: codings.filter((c) => c.documentId === doc.id).length,
    }))

    const topDocuments = docCodingCounts
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, maxDocuments)
      .map((d) => d.doc)

    // Build matrix: rows = codes, columns = documents
    const matrix: number[][] = []
    let maxVal = 0

    // Calculate totals for each code (row sums)
    const rowTotals: number[] = []
    // Calculate totals for each document (column sums)
    const colTotals: number[] = new Array(topDocuments.length).fill(0)

    for (let i = 0; i < topCodes.length; i++) {
      matrix[i] = []
      let rowSum = 0

      for (let j = 0; j < topDocuments.length; j++) {
        const count = codings.filter(
          (c) => c.codeId === topCodes[i].id && c.documentId === topDocuments[j].id
        ).length

        matrix[i][j] = count
        rowSum += count
        colTotals[j] += count
        maxVal = Math.max(maxVal, count)
      }

      rowTotals.push(rowSum)
    }

    return {
      matrix,
      displayCodes: topCodes,
      displayDocuments: topDocuments,
      maxValue: maxVal,
      totals: { rows: rowTotals, cols: colTotals },
    }
  }, [codes, codings, documents, maxCodes, maxDocuments])

  const getOpacity = useCallback(
    (value: number) => {
      if (maxValue === 0) return 0.1
      if (value === 0) return 0
      return 0.2 + (value / maxValue) * 0.8
    },
    [maxValue]
  )

  const getColor = useCallback(
    (value: number, codeColor: string) => {
      if (value === 0) return 'transparent'
      const opacity = getOpacity(value)
      // Use the code's color with calculated opacity
      return codeColor + Math.round(opacity * 255).toString(16).padStart(2, '0')
    },
    [getOpacity]
  )

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    const value = matrix[rowIdx][colIdx]
    if (value === 0) return

    setSelectedCell(
      selectedCell?.row === rowIdx && selectedCell?.col === colIdx
        ? null
        : { row: rowIdx, col: colIdx }
    )

    if (onCellClick) {
      const code = displayCodes[rowIdx]
      const doc = displayDocuments[colIdx]
      onCellClick(code.id, doc.id, value)
    }
  }

  if (displayCodes.length === 0 || displayDocuments.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconFilter size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Keine Kodierungen vorhanden</p>
        <p className="text-xs mt-1">Kodieren Sie Dokumente, um die Verteilung zu sehen</p>
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
                Zeigt die Verteilung der Codes ueber die Dokumente. Je intensiver die Farbe, desto
                haeufiger wurde der Code in diesem Dokument verwendet.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">
            {displayCodes.length} Codes x {displayDocuments.length} Dokumente
          </span>
          {showExport && <ChartExportButton chartRef={chartRef} filename="code_document_heatmap" />}
        </div>
      </div>

      {/* Heatmap */}
      <div ref={chartRef} className="bg-surface-900 rounded-xl p-4 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header row - Document names */}
          <div className="flex">
            <div className="w-32 h-10 flex-shrink-0" /> {/* Corner */}
            {displayDocuments.map((doc, idx) => (
              <div
                key={`header-${doc.id}`}
                className="w-16 h-24 flex items-end justify-center pb-2 flex-shrink-0"
              >
                <div className="flex flex-col items-center">
                  <IconFileText size={14} className="text-surface-500 mb-1" />
                  <span
                    className="text-xs text-surface-400 truncate origin-bottom-left -rotate-45 whitespace-nowrap max-w-[80px]"
                    title={doc.name}
                  >
                    {doc.name.length > 10 ? doc.name.slice(0, 8) + '...' : doc.name}
                  </span>
                </div>
              </div>
            ))}
            <div className="w-12 h-24 flex items-end justify-center pb-2 flex-shrink-0">
              <span className="text-xs text-surface-500 font-medium">Summe</span>
            </div>
          </div>

          {/* Matrix rows */}
          {displayCodes.map((code, rowIdx) => (
            <div key={`row-${code.id}`} className="flex items-center">
              {/* Row label */}
              <div className="w-32 h-10 flex items-center gap-2 pr-2 flex-shrink-0">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: code.color }}
                />
                <span className="text-xs text-surface-400 truncate" title={code.name}>
                  {code.name.length > 14 ? code.name.slice(0, 12) + '...' : code.name}
                </span>
              </div>

              {/* Cells */}
              {displayDocuments.map((doc, colIdx) => {
                const value = matrix[rowIdx][colIdx]
                const isHovered = hoveredCell?.row === rowIdx || hoveredCell?.col === colIdx
                const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx

                return (
                  <div
                    key={`cell-${code.id}-${doc.id}`}
                    className={`w-16 h-10 flex items-center justify-center text-xs transition-all flex-shrink-0 border border-surface-800 ${
                      isHovered && value > 0 ? 'ring-1 ring-primary-500' : ''
                    } ${isSelected ? 'ring-2 ring-primary-400' : ''} ${
                      value > 0 && onCellClick ? 'cursor-pointer hover:scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: value > 0 ? getColor(value, code.color) : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => value > 0 && handleCellClick(rowIdx, colIdx)}
                    title={`${code.name} in "${doc.name}": ${value} Kodierung${value !== 1 ? 'en' : ''}`}
                  >
                    {value > 0 && (
                      <span className="font-medium text-white drop-shadow-sm">{value}</span>
                    )}
                  </div>
                )
              })}

              {/* Row sum */}
              <div className="w-12 h-10 flex items-center justify-center text-xs flex-shrink-0 bg-surface-800/50">
                <span className="font-medium text-surface-300">{totals.rows[rowIdx]}</span>
              </div>
            </div>
          ))}

          {/* Column sums row */}
          <div className="flex items-center border-t border-surface-700 mt-1 pt-1">
            <div className="w-32 h-8 flex items-center pr-2 flex-shrink-0">
              <span className="text-xs text-surface-500 font-medium">Summe</span>
            </div>
            {totals.cols.map((sum, idx) => (
              <div
                key={`sum-${idx}`}
                className="w-16 h-8 flex items-center justify-center text-xs flex-shrink-0 bg-surface-800/50"
              >
                <span className="font-medium text-surface-300">{sum}</span>
              </div>
            ))}
            <div className="w-12 h-8 flex items-center justify-center text-xs flex-shrink-0 bg-surface-700/50">
              <span className="font-bold text-surface-200">
                {totals.cols.reduce((a, b) => a + b, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-surface-500 px-2">
        <div className="flex items-center gap-4">
          <span>Farbintensitaet = Kodierungshaeufigkeit</span>
        </div>
        <span>Klicken Sie auf eine Zelle, um die Kodierungen anzuzeigen</span>
      </div>

      {/* Selected cell info */}
      {selectedCell && (
        <div className="bg-surface-800 border border-surface-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-3 h-3 rounded"
              style={{ backgroundColor: displayCodes[selectedCell.row].color }}
            />
            <span className="text-surface-200">{displayCodes[selectedCell.row].name}</span>
            <span className="text-surface-500">in</span>
            <IconFileText size={14} className="text-surface-400" />
            <span className="text-surface-200">{displayDocuments[selectedCell.col].name}</span>
          </div>
          <p className="text-sm text-surface-400">
            {matrix[selectedCell.row][selectedCell.col]} Kodierung
            {matrix[selectedCell.row][selectedCell.col] !== 1 ? 'en' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
