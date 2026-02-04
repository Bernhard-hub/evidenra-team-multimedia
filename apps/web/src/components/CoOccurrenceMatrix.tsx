import { useMemo, useState } from 'react'
import type { Code, Coding, Document } from '@/stores/projectStore'

interface CoOccurrenceMatrixProps {
  codes: Code[]
  codings: Coding[]
  documents: Document[]
  maxCodes?: number
}

export default function CoOccurrenceMatrix({
  codes,
  codings,
  documents,
  maxCodes = 8,
}: CoOccurrenceMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)

  const { matrix, displayCodes, maxValue } = useMemo(() => {
    // Get top codes by frequency
    const codeFrequencies = codes.map((code) => ({
      code,
      count: codings.filter((c) => c.codeId === code.id).length,
    }))

    const topCodes = codeFrequencies
      .sort((a, b) => b.count - a.count)
      .slice(0, maxCodes)
      .map((c) => c.code)

    // Calculate co-occurrence matrix
    // Two codes co-occur if they appear in the same document
    const matrix: number[][] = []
    let maxVal = 0

    for (let i = 0; i < topCodes.length; i++) {
      matrix[i] = []
      for (let j = 0; j < topCodes.length; j++) {
        if (i === j) {
          // Diagonal: show code's own frequency
          const count = codings.filter((c) => c.codeId === topCodes[i].id).length
          matrix[i][j] = count
          maxVal = Math.max(maxVal, count)
        } else {
          // Co-occurrence: count documents where both codes appear
          const docsWithCodeI = new Set(
            codings
              .filter((c) => c.codeId === topCodes[i].id)
              .map((c) => c.documentId)
          )
          const docsWithCodeJ = new Set(
            codings
              .filter((c) => c.codeId === topCodes[j].id)
              .map((c) => c.documentId)
          )

          let coOccurrence = 0
          docsWithCodeI.forEach((docId) => {
            if (docsWithCodeJ.has(docId)) {
              coOccurrence++
            }
          })

          matrix[i][j] = coOccurrence
          maxVal = Math.max(maxVal, coOccurrence)
        }
      }
    }

    return { matrix, displayCodes: topCodes, maxValue: maxVal }
  }, [codes, codings, maxCodes])

  if (displayCodes.length === 0) {
    return (
      <div className="text-center py-8 text-surface-500">
        <p className="text-sm">Keine Codes vorhanden</p>
      </div>
    )
  }

  const getOpacity = (value: number) => {
    if (maxValue === 0) return 0.1
    return 0.1 + (value / maxValue) * 0.9
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Header row with code names */}
        <div className="flex">
          <div className="w-24 h-8" /> {/* Empty corner cell */}
          {displayCodes.map((code, idx) => (
            <div
              key={`header-${code.id}`}
              className="w-10 h-24 flex items-end justify-center pb-2"
            >
              <span
                className="text-xs text-surface-400 truncate origin-bottom-left -rotate-45 whitespace-nowrap"
                style={{ maxWidth: '80px' }}
                title={code.name}
              >
                {code.name.length > 10 ? code.name.slice(0, 8) + '...' : code.name}
              </span>
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        {displayCodes.map((rowCode, rowIdx) => (
          <div key={`row-${rowCode.id}`} className="flex items-center">
            {/* Row label */}
            <div className="w-24 h-10 flex items-center gap-2 pr-2">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: rowCode.color }}
              />
              <span
                className="text-xs text-surface-400 truncate"
                title={rowCode.name}
              >
                {rowCode.name.length > 10 ? rowCode.name.slice(0, 8) + '...' : rowCode.name}
              </span>
            </div>

            {/* Matrix cells */}
            {displayCodes.map((colCode, colIdx) => {
              const value = matrix[rowIdx][colIdx]
              const isDiagonal = rowIdx === colIdx
              const isHovered =
                hoveredCell?.row === rowIdx || hoveredCell?.col === colIdx

              return (
                <div
                  key={`cell-${rowCode.id}-${colCode.id}`}
                  className={`w-10 h-10 flex items-center justify-center text-xs cursor-pointer transition-all ${
                    isHovered ? 'ring-1 ring-primary-500' : ''
                  }`}
                  style={{
                    backgroundColor: isDiagonal
                      ? `${rowCode.color}${Math.round(getOpacity(value) * 255).toString(16).padStart(2, '0')}`
                      : `rgba(59, 130, 246, ${getOpacity(value)})`,
                  }}
                  onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={
                    isDiagonal
                      ? `${rowCode.name}: ${value} Kodierungen`
                      : `${rowCode.name} & ${colCode.name}: ${value} gemeinsame Dokumente`
                  }
                >
                  <span className={value > 0 ? 'text-white font-medium' : 'text-surface-600'}>
                    {value}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-surface-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500/30" />
          <span>Wenige Ko-Okkurrenzen</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>Viele Ko-Okkurrenzen</span>
        </div>
      </div>
    </div>
  )
}
