import { useMemo } from 'react'
import type { Code, Coding } from '@/stores/projectStore'

interface CodingTimelineProps {
  codings: Coding[]
  codes: Code[]
  days?: number
}

export default function CodingTimeline({
  codings,
  codes,
  days = 30,
}: CodingTimelineProps) {
  const timelineData = useMemo(() => {
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)

    // Group codings by day and code
    const dailyData: {
      date: string
      dateObj: Date
      codings: { codeId: string; count: number }[]
      total: number
    }[] = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const dayCodings = codings.filter((c) => {
        const codingDate = new Date(c.createdAt)
        return codingDate.toISOString().split('T')[0] === dateStr
      })

      // Group by code
      const codeGroups = new Map<string, number>()
      dayCodings.forEach((c) => {
        codeGroups.set(c.codeId, (codeGroups.get(c.codeId) || 0) + 1)
      })

      dailyData.push({
        date: dateStr,
        dateObj: date,
        codings: Array.from(codeGroups.entries()).map(([codeId, count]) => ({
          codeId,
          count,
        })),
        total: dayCodings.length,
      })
    }

    return dailyData
  }, [codings, days])

  const maxDaily = Math.max(...timelineData.map((d) => d.total), 1)

  // Get top codes for legend
  const topCodes = useMemo(() => {
    const codeCounts = new Map<string, number>()
    codings.forEach((c) => {
      codeCounts.set(c.codeId, (codeCounts.get(c.codeId) || 0) + 1)
    })

    return Array.from(codeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([codeId]) => codes.find((c) => c.id === codeId))
      .filter(Boolean) as Code[]
  }, [codings, codes])

  if (codings.length === 0) {
    return (
      <div className="text-center py-8 text-surface-500">
        <p className="text-sm">Keine Kodierungen im Zeitraum</p>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="flex items-end gap-0.5 h-32">
        {timelineData.map((day, idx) => {
          const height = maxDaily > 0 ? (day.total / maxDaily) * 100 : 0
          const isToday = day.dateObj.toDateString() === new Date().toDateString()

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center group"
            >
              {/* Bar */}
              <div
                className={`w-full relative rounded-t transition-all duration-300 hover:opacity-80 ${
                  isToday ? 'ring-2 ring-primary-500' : ''
                }`}
                style={{
                  height: `${Math.max(height, day.total > 0 ? 4 : 0)}%`,
                }}
                title={`${formatDate(day.dateObj)}: ${day.total} Kodierungen`}
              >
                {/* Stacked colors for different codes */}
                {day.codings.length > 0 && (
                  <div className="absolute inset-0 flex flex-col-reverse overflow-hidden rounded-t">
                    {day.codings.map((coding, cidx) => {
                      const code = codes.find((c) => c.id === coding.codeId)
                      const segmentHeight = (coding.count / day.total) * 100
                      return (
                        <div
                          key={`${day.date}-${coding.codeId}`}
                          style={{
                            height: `${segmentHeight}%`,
                            backgroundColor: code?.color || '#666',
                          }}
                        />
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-surface-800 rounded-lg shadow-xl p-2 text-xs whitespace-nowrap">
                  <p className="font-medium text-surface-100">{formatDate(day.dateObj)}</p>
                  <p className="text-surface-400">{day.total} Kodierungen</p>
                  {day.codings.slice(0, 3).map((coding) => {
                    const code = codes.find((c) => c.id === coding.codeId)
                    return (
                      <div key={coding.codeId} className="flex items-center gap-1 mt-1">
                        <span
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: code?.color }}
                        />
                        <span className="text-surface-300">{code?.name}: {coding.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-surface-500 px-1">
        <span>{formatDate(timelineData[0]?.dateObj)}</span>
        <span>{formatDate(timelineData[Math.floor(days / 2)]?.dateObj)}</span>
        <span>{formatDate(timelineData[days - 1]?.dateObj)}</span>
      </div>

      {/* Legend */}
      {topCodes.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-2">
          {topCodes.map((code) => (
            <div key={code.id} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: code.color }}
              />
              <span className="text-xs text-surface-400">{code.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
