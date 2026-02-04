import { useMemo } from 'react'
import type { Code, Coding } from '@/stores/projectStore'

interface CodeFrequencyChartProps {
  codes: Code[]
  codings: Coding[]
  maxBars?: number
  orientation?: 'horizontal' | 'vertical'
}

export default function CodeFrequencyChart({
  codes,
  codings,
  maxBars = 10,
  orientation = 'horizontal',
}: CodeFrequencyChartProps) {
  const data = useMemo(() => {
    // Calculate frequency for each code
    const frequencies = codes.map((code) => ({
      id: code.id,
      name: code.name,
      color: code.color,
      count: codings.filter((c) => c.codeId === code.id).length,
    }))

    // Sort by count and take top N
    return frequencies
      .sort((a, b) => b.count - a.count)
      .slice(0, maxBars)
  }, [codes, codings, maxBars])

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-surface-500">
        <p className="text-sm">Keine Kodierungen vorhanden</p>
      </div>
    )
  }

  if (orientation === 'vertical') {
    return (
      <div className="flex items-end justify-between gap-2 h-48 px-4">
        {data.map((item) => (
          <div
            key={item.id}
            className="flex-1 flex flex-col items-center gap-2"
          >
            <div
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${(item.count / maxCount) * 100}%`,
                minHeight: item.count > 0 ? '8px' : '0',
                backgroundColor: item.color,
              }}
              title={`${item.name}: ${item.count}`}
            />
            <span className="text-xs text-surface-500 truncate max-w-full" title={item.name}>
              {item.name.length > 8 ? item.name.slice(0, 6) + '...' : item.name}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Horizontal bars
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <div className="w-24 flex items-center gap-2 flex-shrink-0">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-surface-300 truncate" title={item.name}>
              {item.name}
            </span>
          </div>
          <div className="flex-1 h-6 bg-surface-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.count / maxCount) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className="text-sm text-surface-400 w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  )
}
